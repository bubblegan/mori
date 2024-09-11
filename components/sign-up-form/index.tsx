import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { useToast } from "@/ui/use-toast";
import { trpc } from "@/utils/trpc";
import { useForm, SubmitHandler } from "react-hook-form";

type SignUpnputForm = {
  username: string;
  password: string;
  email: string;
};

const SignUpForm = () => {
  const form = useForm<SignUpnputForm>();
  const { toast } = useToast();

  const { mutate: createUser } = trpc.auth.create.useMutation({
    onSuccess() {
      toast({ description: "User Created" });
    },
  });

  const onSubmit: SubmitHandler<SignUpnputForm> = (data) => {
    createUser({
      username: data.username,
      password: data.password,
      email: data.email,
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
        <Input className="mt-1 text-white" {...form.register("password")} />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className="text-white">
          Email
        </label>
        <Input className="mt-1 text-white" {...form.register("email")} />
      </div>
      <Button className="w-fit" type="submit">
        Submit
      </Button>
    </form>
  );
};

export default SignUpForm;
