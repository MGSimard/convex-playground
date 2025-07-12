# Convex Playground

https://docs.convex.dev/home

## Convex Auth

Auth: https://labs.convex.dev/auth
OAuth: https://labs.convex.dev/auth/config/oauth
Magic Links: https://labs.convex.dev/auth/config/email
OTPs: https://labs.convex.dev/auth/config/otps
APIs: https://labs.convex.dev/auth/api_reference/react
RLS: https://stack.convex.dev/row-level-security
Auth callbacks: https://labs.convex.dev/auth/advanced#writing-additional-data-during-authentication

Production: https://labs.convex.dev/auth/production

TanStack Router Route Auth: https://tanstack.com/router/v1/docs/framework/react/guide/authenticated-routes

## Convex + TanStack Query

https://docs.convex.dev/client/tanstack-query

## Convex Components

Built for scale
https://www.convex.dev/components

## UI Libraries

shadcn/ui  
https://ui.shadcn.com/  
https://uipub.com/pure-ui  
https://shadcnstudio.com/  
https://tailark.com/  
https://reui.io/

Base UI  
https://base-ui.com/react/overview/quick-start

## tldraw

Sync: https://tldraw.dev/docs/collaboration#tldraw-sync
Persistence: https://tldraw.dev/docs/persistence
Backend Integration: https://tldraw.dev/docs/collaboration#Using-other-collaboration-backends

## Button Loader example

```typescript
import { Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
export function ButtonLoading() {
  return (
  <Button type="submit" className="grid place-items-center" disabled={isPending}>
    <Loader2Icon className={`col-start-1 row-start-1 animate-spin${isPending ? " visible" : " invisible"}`} />
    <span className={`col-start-1 row-start-1${isPending ? " invisible" : " visible"}`}>Create board</span>
  </Button>
  )
}
```

## TASK LIST:

- [ ] Look into beautifing convex errors (currently it prints out the whole weird convex throw instead of my message only in sonner)
- [ ] Move board search results to context, consume in combobox AND sync index
- [ ] Show favorited boards on top
- [ ] Edit card (Makes it a textarea? Or use contenteditable)
- [ ] Direct click on card (role?) opens dialog with options
- [ ] Text at top of card max lines with scrollable, show list, desc?
- [ ] Error & NotFound routes
- [ ] Finish auth system (need roles, authorization, perms)
- [ ] Team Settings
- [ ] General organization settings
- [ ] Implement perms on boards (Join, delete, leave (owner can't leave))
- [ ] Start chatting functionality
- [ ] Notion functionality
- [ ] Overview
