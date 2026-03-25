import { signIn } from "@/auth";

export default function SignIn() {
  return (
    <form
      action={async (formData: FormData) => {
        "use server";
        await signIn("resend", formData);
      }}
    >
      <input type="text" name="email" placeholder="Email" required />
      <button type="submit">Sign In</button>
    </form>
  );
}
