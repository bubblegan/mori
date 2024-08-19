import SignUpForm from "@/components/sign-up-form";

export default function SignUp() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-[500px] h-fit p-10 border-gray-400 border-solid border-2 rounded-md">
        <SignUpForm />
      </div>
    </div>
  );
}
