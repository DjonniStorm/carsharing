import { Center, Container } from "@mantine/core";

import { LoginFormView } from "@/features/auth/ui/login-form";

const LoginPage = () => {
  return (
    <Center mih="100dvh" px="md" py="xl">
      <Container size={420} w="100%" maw={420}>
        <LoginFormView />
      </Container>
    </Center>
  );
};

LoginPage.displayName = "LoginPage";

export { LoginPage };
