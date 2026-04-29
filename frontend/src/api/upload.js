import { http } from "./http";

export const uploadFile = async (file) => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await http.post("/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
};
