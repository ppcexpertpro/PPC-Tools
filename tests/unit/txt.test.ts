import { readTextFile } from "@/lib/file-parsing/txt";

describe("readTextFile", () => {
  it("reads the full text content of a .txt file", async () => {
    const file = new File(["running shoes\nhiking boots"], "list.txt", {
      type: "text/plain",
    });

    const text = await readTextFile(file);

    expect(text).toBe("running shoes\nhiking boots");
  });
});
