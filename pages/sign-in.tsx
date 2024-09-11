import SignInForm from "@/components/sign-in-form";

export default function SignIn() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-fit w-[500px] rounded-md border border-solid border-border p-8">
        <SignInForm />
      </div>
    </div>
  );
}
