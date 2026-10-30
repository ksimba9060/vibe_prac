# 그린플레이트

건강 맞춤 맛집 프론트엔드. React + TypeScript + Vite와 Supabase Auth/Database/Storage를 사용합니다.

## 실행

Node.js 22 이상에서 `npm install`, `npm run dev` 후 http://127.0.0.1:3000 에 접속합니다.
`.env`의 VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY를 설정합니다. 기존 값은 유지한 채 변수 이름을 Vite 형식으로 이전했습니다. Secret/service_role 키는 사용하지 않습니다.

## 프로젝트 구조

```text
vibe_prac/
├── public/                  # 이미지·폰트와 관리자 설정 페이지
├── src/
│   ├── components/          # 로그인 화면, 공통 대화상자
│   ├── data/restaurants.ts  # 기존 예시 식당 데이터와 타입
│   ├── lib/supabase.ts      # Supabase 클라이언트
│   ├── lib/viewStore.ts     # React 외부 상태 구독
│   ├── screens/GreenPlate.tsx # 기존 화면·회원 데이터 동작
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── types.ts
│   └── vite-env.d.ts
├── supabase/setup.sql
├── tests/app.test.tsx
├── .env                     # Git 제외
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

- `npm run dev`: Vite 개발 서버, http://127.0.0.1:3000
- `npm run build`: TypeScript 검사와 배포 빌드, `dist/` 출력
- `npm run preview`: 빌드된 앱 로컬 확인 (개발 서버를 종료하고 실행)
- `npm run check`: TypeScript 검사
- `npm test`: Vitest + React Testing Library 회귀 검사

기존 순수 JavaScript 버전은 저장소 바깥의 `../../outputs/before-react-migration/`에 백업했습니다. 화면은 JSX와 React 이벤트로 전환했고 기존 HTML 문자열 삽입과 전역 스크립트 로딩은 제거했습니다. Supabase 프로젝트·테이블·식당 ID·저장 문서 형식·인증 아이디 변환·세션 저장 키를 유지하여 기존 데이터와 계정을 그대로 사용합니다. DB 초기 설정을 이미 완료했다면 다시 실행할 필요가 없습니다.

## 회원 기능 초기 설정 (프로젝트 관리자)

1. http://127.0.0.1:3000/setup.html 에서 설정 SQL을 복사합니다. 원본은 `supabase/setup.sql`입니다.
2. 해당 Supabase 프로젝트 SQL Editor에 붙여넣고 실행합니다. 재실행할 수 있습니다.
3. Authentication → Sign In / Providers → Email에서 Confirm email을 끄고 저장합니다.
4. 앱의 회원가입에서 원하는 아이디·비밀번호를 입력합니다. 가입한 값으로 로그인합니다.

실제 이메일을 수집하지 않는 간단 가입입니다. 아이디를 NFKC 정규화·소문자화 후 SHA-256으로 내부 인증 이메일에 대응시킵니다. 비밀번호도 버전 고정된 SHA-256 표현으로 변환해 Supabase Auth에 전달하므로 한 글자 비밀번호도 입력할 수 있습니다. 이 표현은 비밀번호와 동등하게 취급해야 하며 앱 데이터에 저장하지 않습니다. 실제 인증과 비밀번호 보관은 Supabase Auth가 담당합니다. 이 방식은 비밀번호 강도를 높이지 않습니다. 이메일 복구 기능은 제공하지 않으며 운영 서비스 전환 시 실제 이메일 인증과 비밀번호 정책을 다시 설계해야 합니다. 잘못된 비밀번호를 허용하는 인증 우회 기능은 없습니다.

## 저장 범위

- `restaurants`: 기존 16개 식당 예시 데이터를 DB로 이전. 로그인한 회원만 조회하며 클라이언트 쓰기는 금지합니다. ID는 기존 배열 인덱스와 동일하게 유지합니다.
- `member_data`: 회원 UUID별 JSON 문서. 건강 목표·알레르기, 저장 식당, 리뷰(식당/별점/본문/혈당/선택 기준/식후 반응/날짜/사진 경로), 최근 검색어, 위치·알림 설정, 검색/추천 카테고리·필터·정렬·안전 필터, 유용해요 선택을 저장합니다. RLS는 본인 행만 허용합니다.
- `review-photos`: 비공개 Storage 버킷. 사용자 UUID 경로로 사진을 저장하고 본인만 조회·업로드·삭제할 수 있습니다. JPG/PNG/WebP/GIF, 각 5MB 이하, 리뷰당 최대 5장. 화면 표시는 1시간 서명 URL을 사용합니다.
- `input_db`: 테스트 입력도 `user_id`에 연결합니다. 기존 익명 테스트 행은 남겨두되 회원 앱에서는 조회할 수 없습니다. 기존 익명 INSERT 정책은 제거합니다.

계정별 데이터를 localStorage에 저장하지 않습니다. Supabase Auth의 세션 유지는 SDK 기본 저장소를 사용합니다. 과거 익명 localStorage 데이터는 소유자를 식별할 수 없어 자동 이관하지 않습니다.
DB 저장은 순서대로 처리하며 실패한 변경은 현재 화면에서 재시도할 수 있습니다. 미저장 변경이 있으면 로그아웃을 막습니다. 여러 탭에서 같은 계정을 동시에 수정하면 마지막 저장이 적용됩니다. 리뷰와 건강 정보는 회원 개인 데이터이며 다른 회원에게 공개되지 않습니다.

## 검증

- `npm run check`: TypeScript 검사
- `npm test`: React 화면 렌더링, 회원가입 폼, 기존 인증 매핑, 검색/AND 필터, 계정별 하트·건강 설정 복원, 텍스트 저장, 리뷰 사진 업로드·메타데이터, 저장 실패/재시도 검사 (Supabase 응답 모의)
- 실제 서비스 검증: 두 계정으로 각각 가입하고 하트/건강 설정/리뷰/사진을 저장한 뒤 새로고침·로그아웃·재로그인해 복원 및 계정 분리를 확인합니다. 미로그인 DB 조회와 다른 사용자 UUID 조회는 RLS로 차단되어야 합니다.

지도는 OpenStreetMap 타일을 합성한 정적 이미지입니다. 식당·영양·인증 정보와 기존 샘플 리뷰는 예시입니다. 공공 데이터, 실제 푸시 발송, 결제, 방문 인증·포인트 적립 서비스는 연결하지 않았습니다. 회원 리뷰·건강 설정 등 앱에서 직접 변경하는 정보만 회원별로 저장됩니다.

Pretendard 라이선스는 assets/Pretendard-LICENSE.txt를 확인하세요.

인증 설정 참고: https://supabase.com/docs/guides/auth/general-configuration
