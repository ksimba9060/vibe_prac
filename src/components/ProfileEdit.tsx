import { useEffect, useState } from "react";
import type { MemberController } from "../screens/GreenPlate";

export function ProfileEdit({
  member,
  onDone,
}: {
  member: MemberController;
  onDone: () => void;
}) {
  const [username, setUsername] = useState(member.name());
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!photo) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(photo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);
  return (
    <section className="profile-editor">
      <h2>프로필 수정</h2>
      <p className="muted">아이디와 프로필 사진을 변경할 수 있어요.</p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;
          setPending(true);
          setMessage("");
          try {
            await member.updateProfile(username.trim(), photo);
            onDone();
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : "프로필을 저장하지 못했어요.",
            );
          } finally {
            setPending(false);
          }
        }}
      >
        <fieldset disabled={pending}>
          <div className="profile-photo-editor">
            <img src={preview || member.avatar()} alt="프로필 사진 미리보기" />
            <label className="secondary">
              사진 변경
              <input
                aria-label="프로필 사진 변경"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (!file) return;
                  if (
                    ![
                      "image/jpeg",
                      "image/png",
                      "image/webp",
                      "image/gif",
                    ].includes(file.type) ||
                    file.size > 5 * 1024 * 1024
                  ) {
                    setMessage(
                      "5MB 이하의 JPG·PNG·WebP·GIF 사진을 선택해 주세요.",
                    );
                    return;
                  }
                  setPhoto(file);
                  setMessage("");
                }}
              />
            </label>
            <small>5MB 이하의 사진을 선택해 주세요.</small>
          </div>
          <label className="profile-id-label" htmlFor="profile-username">
            아이디
          </label>
          <input
            id="profile-username"
            className="field"
            name="username"
            required
            maxLength={40}
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <p className="muted">
            아이디를 바꾸면 다음 로그인부터 새 아이디를 사용해 주세요.
          </p>
          <p className="auth-message" role="status">
            {message}
          </p>
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={onDone}>
              취소
            </button>
            <button className="primary" type="submit">
              {pending ? "저장 중…" : "변경사항 저장"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
