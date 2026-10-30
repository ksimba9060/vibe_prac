import React from "react";
import type { MemberController } from "../screens/GreenPlate";
export function AuthScreen({ member }: { member: MemberController }) {
  const loading = member.phase === "loading";
  const title = loading
    ? "내 정보를 불러오고 있어요"
    : member.phase === "data-error"
      ? "데이터를 불러오지 못했어요"
      : member.mode === "signup"
        ? "간단하게 시작하세요"
        : "다시 만나 반가워요";
  const message =
    member.phase === "data-error"
      ? "연결 상태를 확인하고 다시 시도해 주세요."
      : member.message;
  document.title = "로그인 · 그린플레이트";
  return (
    <main className={"auth-screen"}>
      <a className={"auth-brand"} href={"#"}>
        {"♧ 그린플레이트"}
      </a>
      <span className={"pill mint"}>{"내 건강에 맞는 한 끼"}</span>
      <h1>{title}</h1>
      <p className={"muted"}>
        {loading
          ? "회원님의 식단과 저장한 식당을 준비합니다."
          : "아이디와 비밀번호만 있으면 충분해요."}
      </p>
      {loading ? (
        ""
      ) : member.phase === "data-error" ? (
        <>
          <p className={"auth-message"} role={"alert"}>
            {String(message)}
          </p>
          <button
            className={"primary"}
            onClick={(event: any) => {
              member.load(member.user);
            }}
          >
            {"다시 불러오기"}
          </button>
          <button
            className={"secondary"}
            onClick={(event: any) => {
              member.logout();
            }}
          >
            {"로그아웃"}
          </button>
        </>
      ) : (
        <>
          <div className={"auth-tabs"}>
            <button
              className={member.mode === "login" ? "active" : ""}
              onClick={(event: any) => {
                member.setMode("login");
              }}
            >
              {"로그인"}
            </button>
            <button
              className={member.mode === "signup" ? "active" : ""}
              onClick={(event: any) => {
                member.setMode("signup");
              }}
            >
              {"회원가입"}
            </button>
          </div>
          <form
            onSubmit={(event: any) => {
              member.submit(event);
            }}
          >
            <label htmlFor={"member-id"}>{"아이디"}</label>
            <input
              id={"member-id"}
              className={"field"}
              name={"username"}
              required={true}
              maxLength={40}
              autoComplete={"username"}
              placeholder={"원하는 아이디"}
            />
            <label htmlFor={"member-password"}>{"비밀번호"}</label>
            <input
              id={"member-password"}
              className={"field"}
              name={"password"}
              type={"password"}
              required={true}
              maxLength={128}
              autoComplete={
                member.mode === "signup" ? "new-password" : "current-password"
              }
              placeholder={"원하는 비밀번호"}
            />
            <p className={"auth-message"} role={"status"}>
              {String(message)}
            </p>
            <button
              className={"primary"}
              type={"submit"}
              disabled={member.pending}
            >
              {member.pending
                ? "처리 중…"
                : member.mode === "signup"
                  ? "가입하고 시작하기"
                  : "로그인"}
            </button>
          </form>
          <p className={"auth-footnote"}>
            {"이메일·전화번호 인증 없이 이용합니다."}
            <br />
            {"가입한 아이디와 비밀번호를 기억해 주세요."}
          </p>
        </>
      )}
    </main>
  );
}
