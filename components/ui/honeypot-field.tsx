import { HONEYPOT_FIELD } from "@/lib/honeypot";

/** 봇 차단용 숨김 필드. 화면 밖에 두고 보조기기에서도 숨긴다. 값이 채워지면 서버가 제출을 버린다. */
export function HoneypotField() {
  return (
    <div className="absolute -left-[9999px]" aria-hidden="true">
      <label>웹사이트<input name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" /></label>
    </div>
  );
}
