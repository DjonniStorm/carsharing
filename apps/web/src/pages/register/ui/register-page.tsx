import { Center, Container } from "@mantine/core";

import { RegisterFormView } from "@/features/auth/ui/register-form";

const RegisterPage = () => {
  return (
    <Center mih="100dvh" px="md" py="xl">
      <Container size={480} w="100%" maw={480}>
        <RegisterFormView />
      </Container>
    </Center>
  );
};

RegisterPage.displayName = "RegisterPage";

export { RegisterPage };
