# Design QA

- Source visual truth: `/var/folders/1t/45r1nxxn33g32fzm99n1tljm0000gn/T/codex-clipboard-4b814c17-bce2-43a5-88d6-5851d16c897f.png`
- Implementation screenshot: `/Users/sanghee/Documents/develop/sokcho-moa/output/banner-header-gap-fixed-desktop-20260720.png`
- Normalized comparison: `/Users/sanghee/Documents/develop/sokcho-moa/output/banner-header-gap-comparison-20260720.png`
- Viewport: desktop, `lg` breakpoint
- State: public home page at the top of the document

## Full-view comparison evidence

The supplied screenshot shows a 7–8px near-white strip immediately below the header border before the visible cyan banner artwork begins. DOM inspection confirms that the header bottom and hero section top already share the same coordinate, so this was not layout margin or padding. Pixel inspection of the desktop WebP confirms that its first 7–8 source rows are near white.

The revised implementation keeps the section at the exact header boundary and extends the desktop picture 8px above the section. The hero's overflow clipping removes the near-white source rows, making the cyan artwork meet the header border directly.

## Focused region comparison evidence

The normalized before/after comparison uses the same header-and-banner region. In the after image, the visible cyan artwork starts immediately after the header border. Browser geometry reports `header.bottom === hero.top`, while the picture begins 8px above the hero top and remains clipped by the existing hero container.

## Required fidelity surfaces

- Fonts and typography: unchanged.
- Spacing and layout rhythm: header height, hero height, and all content positions are unchanged; only the desktop artwork inside the clipped hero is shifted upward by 8px.
- Colors and visual tokens: unchanged. The apparent white separator is removed so the banner's cyan top color is visible at the boundary.
- Image quality and asset fidelity: the original WebP is preserved without recompression or replacement. The near-white top rows are clipped only at the desktop breakpoint.
- Copy and content: unchanged.

## Findings

- No remaining P0, P1, or P2 issue at the header/banner boundary.
- No horizontal overflow was introduced.
- Browser console errors: 0.

## Comparison history

1. Earlier finding: P2 a near-white 7–8px band in the desktop source image looked like layout spacing between the header and banner.
2. Fix: extend the desktop picture 8px above the hero container while retaining overflow clipping.
3. Post-fix evidence: the normalized comparison shows the cyan artwork directly touching the header border; computed geometry confirms a 0px section gap and an 8px clipped image offset.

## Interaction and regression checks

- Header navigation remains unchanged.
- Mobile artwork positioning is unchanged because the offset begins at the `lg` breakpoint.
- Lint and type checks: passed.
- Browser console errors: 0.

final result: passed
