import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import API from "@/lib/api";

export const useLogin = () => {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      API.post("/auth/login", data),
    onSuccess: (res) => {
      const token = res.data.token;
      if (token) {
        localStorage.setItem("token", token);
      }
      navigate("/dashboard");
    },
  });
};

export const useOnboard = () => {
  return useMutation({
    mutationFn: (data: {
      name: string;
      email: string;
      password: string;
      companyName: string;
    }) => API.post("/auth/onboard", data),
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  return () => {
    localStorage.removeItem("token");
    navigate("/login");
  };
};
