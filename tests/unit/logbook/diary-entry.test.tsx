import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiaryEntry, type DiaryLog } from "@/components/logbook/diary-entry";

function makeLog(overrides: Partial<DiaryLog> = {}): DiaryLog {
  return {
    id: "1",
    album_id: "a1",
    album_name: "Discovery",
    artist_name: "Daft Punk",
    cover_url: null,
    rating: 3,
    shelves: ["listened"],
    review_text: "Great record",
    created_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("DiaryEntry", () => {
  it("discards an unsaved rating edit when collapsed via the edit toggle", async () => {
    const user = userEvent.setup();
    const log = makeLog({ rating: 3 });

    render(<DiaryEntry log={log} onSave={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByText("3.0")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit entry" }));

    const starButtons = screen.getAllByRole("button", { name: "★" });
    await user.click(starButtons[9]); // last half-star step = 5.0

    expect(screen.getByText("5.0")).toBeInTheDocument();

    // Collapse via the pencil icon (not the footer Cancel button).
    await user.click(screen.getByRole("button", { name: "Cancel edit" }));

    expect(screen.getByText("3.0")).toBeInTheDocument();
    expect(screen.queryByText("5.0")).not.toBeInTheDocument();
  });
});
