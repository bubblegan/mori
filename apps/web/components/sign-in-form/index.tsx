import { useCallback } from "react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { useToast } from "@/ui/use-toast";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";

type LoginInputForm = {
  username: string;
  password: string;
};

const SignInForm = () => {
  const form = useForm<LoginInputForm>();
  const { toast } = useToast();

  const onSubmit = useCallback(
    async (data: LoginInputForm) => {
      try {
        const value = await signIn("credentials", { ...data, callbackUrl: "/expenses" });
        if (value?.ok) {
          toast({ description: "Signed In." });
        }
      } catch (err) {
        console.error(err);
      }
    },
    [toast]
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm text-white">
          Username
        </label>
        <Input className="mt-1 text-white" {...form.register("username")} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-sm text-white">
          Password
        </label>
        <Input type="password" className="mt-1 text-white" {...form.register("password")} />
      </div>
      <div className="flex w-full flex-row-reverse">
        <Button className="w-fit" type="submit">
          Login
        </Button>
      </div>
    </form>
  );
};

export default SignInForm;
