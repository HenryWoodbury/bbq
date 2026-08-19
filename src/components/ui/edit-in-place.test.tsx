// @vitest-environment jsdom

import { act, render as rtlRender, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { createRef } from "react"
import { describe, expect, it, vi } from "vitest"
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  EditInPlace,
  type EditInPlaceHandle,
} from "@/components/ui/edit-in-place"
import { TooltipProvider } from "@/components/ui/tooltip"

// The accept/cancel IconButtons are tooltip triggers; app/layout.tsx wraps the
// whole tree in TooltipProvider, so mirror that here.
function render(ui: React.ReactNode) {
  return rtlRender(<TooltipProvider>{ui}</TooltipProvider>)
}

function trigger() {
  return screen.getByRole("button", { name: /^Edit / })
}

describe("EditInPlace", () => {
  it("exposes the read state as a button, not a bare click target", () => {
    render(<EditInPlace value="Wrigley Field" onChange={vi.fn()} />)
    expect(trigger()).toHaveAttribute("type", "button")
  })

  it("enters edit mode from the keyboard alone", async () => {
    const user = userEvent.setup()
    render(<EditInPlace value="Wrigley Field" onChange={vi.fn()} />)

    await user.tab()
    expect(trigger()).toHaveFocus()
    await user.keyboard("{Enter}")

    expect(screen.getByRole("textbox")).toHaveValue("Wrigley Field")
  })

  it("enters edit mode on click", async () => {
    const user = userEvent.setup()
    render(<EditInPlace value="Wrigley Field" onChange={vi.fn()} />)

    await user.click(trigger())

    expect(screen.getByRole("textbox")).toHaveFocus()
  })

  it("commits the draft on Enter", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<EditInPlace value="Wrigley" onChange={onChange} />)

    await user.click(trigger())
    await user.clear(screen.getByRole("textbox"))
    await user.keyboard("Fenway{Enter}")

    expect(onChange).toHaveBeenCalledWith("Fenway")
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  })

  it("discards the draft on Escape", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<EditInPlace value="Wrigley" onChange={onChange} />)

    await user.click(trigger())
    await user.keyboard("xyz{Escape}")

    expect(onChange).not.toHaveBeenCalled()
    expect(trigger()).toBeInTheDocument()
  })

  it("commits via the Accept control and discards via Cancel", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<EditInPlace value="Wrigley" onChange={onChange} />)

    await user.click(trigger())
    await user.keyboard("!")
    await user.click(screen.getByRole("button", { name: "Accept" }))
    expect(onChange).toHaveBeenCalledWith("Wrigley!")

    await user.click(trigger())
    await user.keyboard("?")
    await user.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it("caps the draft at maxLength", async () => {
    const user = userEvent.setup()
    render(<EditInPlace value="ab" maxLength={3} onChange={vi.fn()} />)

    await user.click(trigger())
    await user.keyboard("cd")

    expect(screen.getByRole("textbox")).toHaveValue("abc")
  })

  it("reports the live draft through the ref while editing", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const ref = createRef<EditInPlaceHandle>()
    render(<EditInPlace ref={ref} value="Wrigley" onChange={onChange} />)

    expect(ref.current?.getCurrentValue()).toBe("Wrigley")

    await user.click(trigger())
    await user.keyboard("!")
    expect(ref.current?.getCurrentValue()).toBe("Wrigley!")

    act(() => ref.current?.commit())
    expect(onChange).toHaveBeenCalledWith("Wrigley!")
  })

  // The only call site renders inside the Edit Heat Map drawer, where Radix
  // listens for Escape on document in the capture phase.
  describe("inside a Drawer", () => {
    function renderInDrawer(onClose: () => void, onChange: () => void) {
      return render(
        <Drawer open onClose={onClose}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Edit Heat Map</DrawerTitle>
            </DrawerHeader>
            <DrawerBody>
              <EditInPlace value="Wrigley" onChange={onChange} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>,
      )
    }

    it("cancels the edit on Escape without closing the drawer", async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      const onChange = vi.fn()
      renderInDrawer(onClose, onChange)

      await user.click(trigger())
      await user.keyboard("xyz{Escape}")

      expect(onClose).not.toHaveBeenCalled()
      expect(onChange).not.toHaveBeenCalled()
      expect(trigger()).toBeInTheDocument()
    })

    it("leaves Escape to the drawer when no edit is in flight", async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      renderInDrawer(onClose, vi.fn())

      await user.keyboard("{Escape}")

      expect(onClose).toHaveBeenCalled()
    })
  })
})
