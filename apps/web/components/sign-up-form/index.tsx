import { useRouter } from "next/router";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { useToast } from "@/ui/use-toast";
import { trpc } from "@/utils/trpc";
import { signIn } from "next-auth/react";
import { useForm, SubmitHandler } from "react-hook-form";

type SignUpnputForm = {
  username: string;
  password: string;
};

const SignUpForm = () => {
  const form = useForm<SignUpnputForm>();
  const { toast } = useToast();
  const router = useRouter();

  const { mutate: createUser } = trpc.auth.create.useMutation({
    onSuccess: async (result) => {
      const response = await signIn("credentials", {
        redirect: false,
        username: result.username,
        password: result.password,
      });

      if (response?.ok) {
        router.push("/expenses");
      }
      toast({ description: "User Created" });
    },
  });

  const onSubmit: SubmitHandler<SignUpnputForm> = (data) => {
    createUser({
      username: data.username,
      password: data.password,
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-white">
          Username
        </label>
        <Input className="mt-1 text-white" {...form.register("username")} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-white">
          Password
        </label>
        <Input className="mt-1 text-white" type="password" {...form.register("password")} />
      </div>
      <div className="flex w-full flex-row-reverse">
        <Button className="w-fit" type="submit">
          Submit
        </Button>
      </div>
    </form>
  );
};

export default SignUpForm;
