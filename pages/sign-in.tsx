import SignInForm from "@/components/sign-in-form";

export default function SignIn() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-[500px] h-fit p-10 border-gray-400 border-solid border-2 rounded-md">
        <SignInForm />
      </div>
    </div>
  );
}
