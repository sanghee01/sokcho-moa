import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import attractionCatalog from "@/data/attractions.json";
import { demoPlaces } from "@/lib/data/demo-data";

const accepted = attractionCatalog.accepted;
const regions = ["속초시", "고성군", "양양군"] as const;
const bounds = {
  속초시: { south: 38.12, west: 128.4, north: 38.26, east: 128.62 },
  고성군: { south: 38.2, west: 128.25, north: 38.62, east: 128.62 },
  양양군: { south: 37.8, west: 128.35, north: 38.2, east: 128.85 },
};

const normalize = (value: string) => value
  .normalize("NFKC")
  .toLowerCase()
  .replace(/[^가-힣a-z0-9]/g, "");

describe("attraction catalog", () => {
  it("expands the original catalog with substantial coverage in every region", () => {
    expect(accepted.length).toBeGreaterThanOrEqual(120);

    for (const region of regions) {
      expect(accepted.filter((place) => place.region === region).length).toBeGreaterThanOrEqual(25);
    }
  });

  it("records exhausted, arithmetically complete official-source coverage", () => {
    expect(attractionCatalog.sources.length).toBeGreaterThanOrEqual(10);

    for (const source of attractionCatalog.sources) {
      expect(source.status).toBe("exhausted");
      expect(source.candidateCount).toBe(
        source.acceptedReferenceCount + source.rejectedReferenceCount,
      );
      expect(source.checkedAt).toBe(attractionCatalog.verifiedAt);
      expect(new URL(source.url).protocol).toBe("https:");
    }

    expect(attractionCatalog.stats).toEqual({
      sourceCandidateReferenceCount: 246,
      acceptedSourceReferenceCount: 147,
      rejectedSourceReferenceCount: 99,
      uniqueAcceptedCount: accepted.length,
      uniqueRejectedCount: attractionCatalog.rejected.length,
    });
    expect(
      attractionCatalog.stats.acceptedSourceReferenceCount
      + attractionCatalog.stats.rejectedSourceReferenceCount,
    ).toBe(attractionCatalog.stats.sourceCandidateReferenceCount);
  });

  it("keeps identifiers and normalized names unique", () => {
    expect(new Set(accepted.map((place) => place.id)).size).toBe(accepted.length);
    expect(new Set(accepted.map((place) => place.slug)).size).toBe(accepted.length);
    expect(new Set(accepted.map((place) => normalize(place.name))).size).toBe(accepted.length);
  });

  it("keeps one rejection decision per normalized regional candidate", () => {
    const sourceIds = new Set(attractionCatalog.sources.map((source) => source.id));
    const rejectionKeys = attractionCatalog.rejected.map(
      (item) => `${item.region}:${normalize(item.name)}`,
    );

    expect(new Set(rejectionKeys).size).toBe(rejectionKeys.length);
    expect(attractionCatalog.rejected.every((item) => item.sourceIds.length > 0)).toBe(true);
    expect(
      attractionCatalog.rejected.every((item) => item.sourceIds.every((id) => sourceIds.has(id))),
    ).toBe(true);
  });

  it("requires traceable sources, valid regional coordinates, and safe links", () => {
    const sourceIds = new Set(attractionCatalog.sources.map((source) => source.id));

    for (const place of accepted) {
      const box = bounds[place.region as keyof typeof bounds];
      expect(box, place.name).toBeDefined();
      expect(place.latitude, place.name).toBeGreaterThanOrEqual(box.south);
      expect(place.latitude, place.name).toBeLessThanOrEqual(box.north);
      expect(place.longitude, place.name).toBeGreaterThanOrEqual(box.west);
      expect(place.longitude, place.name).toBeLessThanOrEqual(box.east);
      expect(place.address, place.name).toContain(place.region);
      expect(place.sourceIds.length, place.name).toBeGreaterThan(0);
      expect(place.sourceIds.every((id) => sourceIds.has(id)), place.name).toBe(true);
      expect(place.evidenceUrls.length, place.name).toBeGreaterThanOrEqual(2);

      for (const url of [place.officialUrl, place.mapUrl, ...place.evidenceUrls]) {
        expect(new URL(url).protocol, `${place.name}: ${url}`).toBe("https:");
      }
    }
  });

  it("excludes ordinary dining, lodging, events, and generic sports facilities", () => {
    const excluded = /음식점|카페|숙소|호텔|모텔|리조트|캠핑장|축제|야구장|체육관|축구장|테니스장|궁도장|카누경기장/;
    expect(accepted.filter((place) => excluded.test(`${place.name} ${place.category}`))).toEqual([]);
    expect(attractionCatalog.rejected.length).toBeGreaterThan(0);
    expect(attractionCatalog.rejected.every((item) => item.reason.length > 0)).toBe(true);
  });

  it("feeds the exact accepted records to demo mode", () => {
    expect(demoPlaces).toEqual(accepted.map((place) => ({
      id: place.id,
      slug: place.slug,
      name: place.name,
      category: place.category,
      summary: place.summary,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      imageUrl: place.imageUrl,
      officialUrl: place.officialUrl,
      mapUrl: place.mapUrl,
      isPublished: place.isPublished,
    })));
  });

  it("includes every accepted place in both generated SQL assets", () => {
    const seed = fs.readFileSync(path.join(process.cwd(), "supabase", "seed.sql"), "utf8");
    const migration = fs.readFileSync(
      path.join(process.cwd(), "supabase", "migrations", "202607200003_expand_places.sql"),
      "utf8",
    );

    for (const place of accepted) {
      expect(seed, place.slug).toContain(`'${place.id}', '${place.slug}'`);
      expect(migration, place.slug).toContain(`'${place.id}', '${place.slug}'`);
    }
    expect(seed).toContain("on conflict (slug) do update set");
    expect(migration).toContain("on conflict (slug) do update set");
  });
});
