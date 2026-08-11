import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GroupCard, type MergeGroupData } from "@/components/shared/GroupCard";

function noop() {}

function renderGroupCard(
  overrides: Partial<React.ComponentProps<typeof GroupCard>> = {},
) {
  const group: MergeGroupData = { id: "g1", label: "Group 1", value: "" };
  return render(
    <GroupCard
      group={group}
      index={0}
      totalGroups={3}
      onLabelChange={noop}
      onValueChange={noop}
      onRemove={noop}
      onMoveUp={noop}
      onMoveDown={noop}
      onDragStart={noop}
      onDragOver={noop}
      onDrop={noop}
      onDragEnd={noop}
      isDragging={false}
      canRemove
      {...overrides}
    />,
  );
}

describe("GroupCard", () => {
  it("reports label edits", async () => {
    const onLabelChange = jest.fn();
    renderGroupCard({ onLabelChange });

    const labelInput = screen.getByDisplayValue("Group 1");
    await userEvent.type(labelInput, "!");
    expect(onLabelChange).toHaveBeenCalled();
  });

  it("reports value edits via the textarea", async () => {
    const onValueChange = jest.fn();
    renderGroupCard({ onValueChange });

    await userEvent.type(
      screen.getByPlaceholderText("One term per line…"),
      "best",
    );
    expect(onValueChange).toHaveBeenCalled();
  });

  it("disables move-up on the first card and move-down on the last", () => {
    renderGroupCard({ index: 0, totalGroups: 3 });
    expect(
      screen.getByRole("button", { name: /move group 1 up/i }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /move group 1 down/i }),
    ).not.toBeDisabled();
  });

  it("hides the remove button when canRemove is false", () => {
    renderGroupCard({ canRemove: false });
    expect(
      screen.queryByRole("button", { name: /remove group 1/i }),
    ).not.toBeInTheDocument();
  });

  it("calls onRemove when the remove button is clicked", async () => {
    const onRemove = jest.fn();
    renderGroupCard({ onRemove, canRemove: true });
    await userEvent.click(
      screen.getByRole("button", { name: /remove group 1/i }),
    );
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
