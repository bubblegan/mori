import SignUpForm from "@/components/sign-up-form";

export default function SignUp() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-fit w-[500px] rounded-md border-2 border-solid border-border p-10">
        <SignUpForm />
      </div>
    </div>
  );
}
