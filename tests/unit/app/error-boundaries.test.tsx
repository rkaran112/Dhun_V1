import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorPage from "@/app/error";
import NotFound from "@/app/not-found";

describe("app/error", () => {
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows the error digest and retries when the user clicks Try again", async () => {
    const retry = jest.fn();
    const error = Object.assign(new Error("boom"), { digest: "abc123" });

    render(<ErrorPage error={error} unstable_retry={retry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    expect(screen.getByText("Error ID: abc123")).toBeInTheDocument();
    expect(screen.queryByText("boom")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledWith(error);
  });

  it("omits the error ID line when there is no digest", () => {
    render(<ErrorPage error={new Error("boom")} unstable_retry={jest.fn()} />);
    expect(screen.queryByText(/Error ID/)).not.toBeInTheDocument();
  });
});

describe("app/not-found", () => {
  it("links back to the home page", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { name: /couldn.t find that page/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to Musicd" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
