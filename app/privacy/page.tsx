import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SITE_INQUIRY_URL } from "@/lib/seo/site-identity";
import { privacyPageMetadata } from "@/lib/seo/utility-page-metadata";

export const metadata: Metadata = privacyPageMetadata;

// 항목 순서는 개인정보 보호법 제30조·시행령 제31조와 개인정보보호위원회 「개인정보 처리방침 작성지침(2026.4.)」을 따른다(2026-11-07).
// 처리하는 정보, 위탁 업체, GA 설정(보관 기간 등)이 바뀌면 이 페이지와 시행일을 함께 고치고 이전 버전을 남긴다.
const EFFECTIVE_DATE = "2026년 11월 7일";
// 보호책임자는 운영자 본인이다. 표기와 연락처는 2026-11-07 사용자 결정.
const PRIVACY_OFFICER_NAME = "이상희";
const PRIVACY_OFFICER_EMAIL = "dltkdgml0816@gmail.com";
const GA_OPT_OUT_URL = "https://tools.google.com/dlpage/gaoptout";
const GOOGLE_PRIVACY_POLICY_URL = "https://policies.google.com/privacy?hl=ko";
const VERCEL_PRIVACY_POLICY_URL = "https://vercel.com/legal/privacy-policy";

const listClassName = "list-disc space-y-2 pl-5";
const linkClassName = "font-medium text-primary-text underline decoration-line-strong underline-offset-4 hover:decoration-primary";
// 문장 밖에 따로 놓인 링크는 누르는 높이를 44px로 둔다(.ai/DESIGN.md Layout). 문장 안 링크는 글자 높이 그대로다.
const standaloneLinkClassName = `${linkClassName} inline-flex min-h-11 items-center`;
const termClassName = "font-semibold text-content-strong";
const subheadingClassName = "text-title-3 text-content-strong";

function PolicySection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-10">
      <h2 id={id} className="text-title-2 text-content-strong">{title}</h2>
      <div className="mt-3 space-y-3 text-body text-content">{children}</div>
    </section>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className={linkClassName} href={href} target="_blank" rel="noreferrer">
      {children}<span className="sr-only">(새 창)</span>
    </a>
  );
}

export default function PrivacyPage() {
  return (
    // 본문 한 줄 최대 폭 40rem(.ai/DESIGN.md 한글 줄바꿈), 제보·의견 페이지와 같은 틀
    <main id="main-content" className="mx-auto max-w-160 px-4 pb-16 pt-8 lg:pt-12">
      <h1 className="text-title-1 text-content-strong lg:text-title-1-lg">개인정보 처리방침</h1>
      <p className="mt-2 text-caption text-content-subtle">시행일 {EFFECTIVE_DATE}</p>
      <p className="mt-4 text-body text-content-muted">
        속초모아(sokchomoa.com)는 회원가입 없이 쓰는 행사 정보 사이트예요. 이름·전화번호·이메일을 받지 않아요.
        다만 사이트를 운영하고 고치려고 아래 정보를 처리해요. 「개인정보 보호법」 제30조에 따라 무엇을 왜 처리하는지,
        어떻게 거부할 수 있는지 알려 드려요.
      </p>

      <PolicySection id="privacy-items" title="1. 처리하는 정보와 목적">
        <h3 className={subheadingClassName}>직접 입력하는 정보</h3>
        <ul className={listClassName}>
          <li>
            <span className={termClassName}>행사 제보</span>: 제목, 본문, 행사 안내 링크(모두 필수). 제보 내용을 확인하고 행사를 등록하는 데 써요.
          </li>
          <li>
            <span className={termClassName}>의견 보내기</span>: 제목, 본문(필수)과 관련 링크, 사진 1장(선택). 사이트를 고치는 데 참고해요.
          </li>
        </ul>
        <p>이름이나 연락처를 묻지 않으니 본문과 사진에 개인정보를 넣지 말아 주세요.</p>

        <h3 className={`${subheadingClassName} pt-2`}>자동으로 수집되는 정보</h3>
        <ul className={listClassName}>
          <li>
            <span className={termClassName}>방문 통계</span>: Google Analytics로 본 화면, 누른 링크·버튼(행사 원문·신청·지도 링크, 주변 명소,
            공유, 정렬과 진행중·마감 탭), 검색한 글자 수와 결과 수, 머문 시간, 들어온 경로, 기기·운영체제·브라우저 종류,
            IP 주소로 추정한 대략적 지역, 브라우저에 저장한 무작위 식별자(쿠키)를 처리해요. 어떤 정보가 쓸모 있는지 보고
            사이트를 고치는 데만 쓰고, 광고에는 쓰지 않아요. 검색어 원문은 보내지 않고, 주소에 담긴 검색어도 가린 뒤 보내요.
          </li>
          <li>
            <span className={termClassName}>반복 요청 막기</span>: 제보·의견 보내기와 조회수 집계에서 같은 곳의 반복 요청을 막으려고,
            접속 IP 주소를 비밀키로 바꾼 값과 요청 시각을 잠깐 기록해요. 이 값으로는 원래 IP 주소를 알아낼 수 없고, IP 주소 원문은 저장하지 않아요.
          </li>
          <li>
            <span className={termClassName}>접속 기록</span>: 사이트를 서비스하는 Vercel이 보안과 오류 대응을 위해 접속 기록(IP 주소,
            요청한 주소, 시각, 브라우저 정보)을 남겨요.
          </li>
        </ul>
      </PolicySection>

      <PolicySection id="privacy-retention" title="2. 보유 기간과 파기">
        <ul className={listClassName}>
          <li>방문 통계: Google Analytics에서 14개월이 지나면 지워져요. 쿠키는 브라우저에 최대 2년 남고, 직접 지울 수 있어요.</li>
          <li>
            제보·의견과 사진: 운영자가 등록하거나 반려한 날부터 1년 동안 보관하고 지워요. 비슷한 제보가 다시 왔을 때 대조하려고 보관해요.
            그 전에 삭제를 요청하면 지체 없이 지워요.
          </li>
          <li>반복 요청 막기 기록: 제한 시간(10분)이 지나면 이후 요청 때 자동으로 지워요.</li>
          <li>
            접속 기록: Vercel 대시보드의 실행 기록은 요금제에 따라 1시간에서 30일이 지나면 지워져요.
            그 밖에 Vercel이 보관하는 기록은 <ExternalLink href={VERCEL_PRIVACY_POLICY_URL}>Vercel 개인정보처리방침</ExternalLink>을 따라요.
          </li>
        </ul>
        <p>
          보유 기간이 끝나거나 삭제를 요청받으면 운영자가 관리 화면에서 데이터베이스 기록과 저장소의 사진을 되살릴 수 없게 삭제해요.
          종이로 출력한 기록은 두지 않아요.
        </p>
      </PolicySection>

      <PolicySection id="privacy-third-party" title="3. 제3자 제공">
        <p>
          처리하는 정보를 다른 곳에 제공하지 않아요. 다만 「개인정보 보호법」 제18조 제2항에 해당하는 경우(법률에 특별한 규정이 있는 경우,
          범죄 수사·공소 제기·재판에 필요한 경우)에는 법령이 정한 절차에 따라 제공할 수 있어요.
        </p>
      </PolicySection>

      <PolicySection id="privacy-entrustment" title="4. 처리 위탁">
        <p>사이트 운영에 필요한 일을 아래 업체에 맡기고 있어요.</p>
        <dl className="space-y-3">
          <div>
            <dt className={termClassName}>Vercel Inc.</dt>
            <dd>웹사이트 호스팅과 서버 실행</dd>
          </div>
          <div>
            <dt className={termClassName}>Supabase, Inc.</dt>
            <dd>제보·의견·사진과 반복 요청 막기 기록 저장. 데이터는 서울(ap-northeast-2) 서버에 보관해요.</dd>
          </div>
          <div>
            <dt className={termClassName}>Google LLC</dt>
            <dd>Google Analytics 방문 통계 수집과 분석</dd>
          </div>
        </dl>
      </PolicySection>

      <PolicySection id="privacy-transfer" title="5. 국외 이전">
        <p>
          아래 정보는 해외에서 처리돼요. 서비스 제공에 필요한 처리 위탁·보관으로, 「개인정보 보호법」 제28조의8 제1항 제3호에 따라 이 방침에 공개해요.
          두 곳 모두 사이트에 접속할 때마다 네트워크로 전송돼요.
        </p>
        <h3 className={subheadingClassName}>Vercel Inc.</h3>
        <dl className="space-y-3">
          <div>
            <dt className={termClassName}>연락처</dt>
            <dd><span className="break-all">privacy@vercel.com</span></dd>
          </div>
          <div>
            <dt className={termClassName}>이전 국가</dt>
            <dd>미국과 Vercel 전송망이 있는 국가</dd>
          </div>
          <div>
            <dt className={termClassName}>항목</dt>
            <dd>IP 주소, 요청한 주소, 시각, 브라우저 정보</dd>
          </div>
          <div>
            <dt className={termClassName}>목적과 보유 기간</dt>
            <dd>웹사이트 전송, 보안·오류 대응. 보유 기간은 2번의 접속 기록과 같아요.</dd>
          </div>
          <div>
            <dt className={termClassName}>거부 방법과 효과</dt>
            <dd>사이트를 이용하지 않는 방법으로 거부할 수 있고, 거부하면 사이트를 볼 수 없어요.</dd>
          </div>
        </dl>
        <h3 className={`${subheadingClassName} pt-2`}>Google LLC</h3>
        <dl className="space-y-3">
          <div>
            <dt className={termClassName}>연락처</dt>
            <dd><ExternalLink href={GOOGLE_PRIVACY_POLICY_URL}>Google 개인정보처리방침</ExternalLink>의 문의 창구</dd>
          </div>
          <div>
            <dt className={termClassName}>이전 국가</dt>
            <dd>미국</dd>
          </div>
          <div>
            <dt className={termClassName}>항목</dt>
            <dd>1번의 방문 통계 항목</dd>
          </div>
          <div>
            <dt className={termClassName}>목적과 보유 기간</dt>
            <dd>방문 통계 분석. 14개월이 지나면 지워져요.</dd>
          </div>
          <div>
            <dt className={termClassName}>거부 방법과 효과</dt>
            <dd>6번의 방법으로 거부할 수 있고, 거부해도 사이트는 그대로 쓸 수 있어요.</dd>
          </div>
        </dl>
      </PolicySection>

      <PolicySection id="privacy-cookies" title="6. 쿠키와 행태정보">
        <p>
          쿠키는 웹사이트가 브라우저에 저장하는 작은 기록이에요. 속초모아는 Google LLC의 Google Analytics 태그(자바스크립트)를 써서
          이름이 _ga로 시작하는 쿠키에 방문자를 구별하는 무작위 식별자와 방문 시각을 저장하고, 1번의 방문 통계 항목을 수집해요.
          목적은 이용 통계 분석이고 맞춤형 광고에는 쓰지 않아요. 수집한 정보는 미국의 Google로 전송돼 14개월 동안 보관돼요.
        </p>
        <p>
          같은 탭에서 한 행사의 조회수를 한 번만 세려고 브라우저 세션 저장소에도 표시를 남겨요. 탭을 닫으면 사라지고 개인을 알아볼 수 있는 정보는 없어요.
        </p>
        <p>쿠키를 거부해도 사이트는 그대로 쓸 수 있어요. 거부 방법은 아래와 같아요. 메뉴 이름은 브라우저 버전에 따라 조금 다를 수 있어요.</p>
        <ul className={listClassName}>
          <li>
            안드로이드 Chrome: 더보기 &gt; 설정 &gt; 개인 정보 보호 및 보안 &gt; 인터넷 사용 기록 삭제에서 &lsquo;쿠키 및 사이트 데이터&rsquo;를 고르고 데이터 삭제
          </li>
          <li>
            iPhone Safari: 설정 &gt; 앱 &gt; Safari &gt; 고급 &gt; 웹사이트 데이터 &gt; 모든 웹사이트 데이터 제거. 계속 막으려면 설정 &gt; 앱 &gt; Safari &gt; 고급에서 &lsquo;모든 쿠키 차단&rsquo;을 켜요.
          </li>
          <li>네이버 웨일, 삼성 인터넷: 설정의 개인정보 메뉴에서 인터넷 사용 기록(검색 데이터)을 지울 때 쿠키를 함께 골라 지워요.</li>
          <li>크롬 시크릿 창, 엣지 InPrivate 창, 웨일·삼성 인터넷 비밀 모드는 창을 닫으면 쿠키가 지워져요.</li>
          <li>
            PC의 Chrome·Firefox·Safari·Edge에서는{" "}
            <ExternalLink href={GA_OPT_OUT_URL}>Google 애널리틱스 차단 부가기능</ExternalLink>을 설치하면 Google Analytics로 보내지 않아요.
          </li>
        </ul>
      </PolicySection>

      <PolicySection id="privacy-rights" title="7. 정보주체의 권리와 행사 방법">
        <p>
          처리하는 개인정보의 열람, 정정·삭제, 처리정지를 요구할 수 있어요. 9번의 연락처로 요청하면 지체 없이 처리해요.
          대리인을 통해 요청할 수 있고, 14세 미만 아동의 법정대리인도 아동의 정보에 대해 같은 권리를 행사할 수 있어요.
          제보·의견은 이름 없이 받으므로, 보낸 날짜와 제목을 알려 주시면 찾을 수 있어요.
        </p>
        <p>
          방문 통계는 쿠키의 무작위 식별자로만 저장돼 특정인의 기록을 찾기 어려워요. 쿠키를 지우거나 차단하면 수집을 멈출 수 있어요.
        </p>
      </PolicySection>

      <PolicySection id="privacy-security" title="8. 안전성 확보 조치">
        <ul className={listClassName}>
          <li>관리 화면은 운영자 계정으로만 들어갈 수 있고, 데이터베이스는 서버에서만 쓰도록 권한을 나눴어요.</li>
          <li>모든 전송을 HTTPS로 암호화해요.</li>
          <li>IP 주소는 원문 대신 되돌릴 수 없는 값으로 바꿔 저장해요.</li>
          <li>비밀키는 코드와 분리해 호스팅 환경에서 관리해요.</li>
        </ul>
      </PolicySection>

      <PolicySection id="privacy-officer" title="9. 개인정보 보호책임자">
        <p>
          속초모아는 개인이 운영해요. 운영자 {PRIVACY_OFFICER_NAME}이 개인정보 처리의 최종 책임을 지고, 보호책임자로서 열람·삭제 요청 접수와
          처리, 고충 상담을 직접 맡아요.
        </p>
        <dl className="space-y-3">
          <div>
            <dt className={termClassName}>보호책임자</dt>
            <dd>{PRIVACY_OFFICER_NAME}(운영자)</dd>
          </div>
          <div>
            <dt className={termClassName}>이메일</dt>
            <dd><a className={`${standaloneLinkClassName} break-all`} href={`mailto:${PRIVACY_OFFICER_EMAIL}`}>{PRIVACY_OFFICER_EMAIL}</a></dd>
          </div>
          <div>
            <dt className={termClassName}>카카오톡</dt>
            <dd><a className={standaloneLinkClassName} href={SITE_INQUIRY_URL} target="_blank" rel="noreferrer">카카오톡 문의<span className="sr-only">(새 창)</span></a></dd>
          </div>
        </dl>
      </PolicySection>

      <PolicySection id="privacy-remedy" title="10. 권익침해 구제 방법">
        <p>개인정보 침해에 대한 상담이나 분쟁 조정은 아래 기관에 요청할 수 있어요.</p>
        <ul className={listClassName}>
          <li>개인정보 분쟁조정위원회: 1833-6972, www.kopico.go.kr</li>
          <li>개인정보침해 신고센터: 118, privacy.kisa.or.kr</li>
          <li>대검찰청: 1301, www.spo.go.kr</li>
          <li>경찰청: 182, ecrm.police.go.kr</li>
        </ul>
      </PolicySection>

      <PolicySection id="privacy-changes" title="11. 처리방침 변경">
        <p>
          이 방침은 {EFFECTIVE_DATE}부터 적용해요. 처음 만든 방침이라 이전 버전은 없어요.
          내용이 바뀌면 시행 7일 전부터 이 페이지에 바뀐 내용과 시행일을 알리고, 이전 버전과 적용 기간을 함께 공개해요.
        </p>
      </PolicySection>
    </main>
  );
}
