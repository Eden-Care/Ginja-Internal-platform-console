import { useMutation, useQueryClient } from "@tanstack/react-query"

import {
  assignMemberRoles,
  deleteMember,
  onboardMember,
  resendInvite,
  revokeInvite,
  sendInvite,
  setMemberStatus,
  unassignMemberRole,
} from "./api"
import { memberKeys } from "./queries"
import type { Member, MemberStatus } from "./types"

/** Shared: invalidate the members list after any member mutation. */
function useInvalidateMembers() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: memberKeys.all })
}

/** Invite = onboard (no password ⇒ INVITED) then send the setup link. */
export function useInviteMember() {
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: async (input: {
      name: string
      email: string
      roleIds: number[]
      expiryDays?: number
    }) => {
      const member = await onboardMember({
        email: input.email,
        full_name: input.name,
        role_ids: input.roleIds,
      })
      await sendInvite(member.id, input.expiryDays)
      return member
    },
    onSuccess: invalidate,
  })
}

export function useSetMemberStatus() {
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: (input: { id: number; status: MemberStatus; reason?: string }) =>
      setMemberStatus(input.id, input.status, input.reason),
    onSuccess: invalidate,
  })
}

export function useResendInvite() {
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: (id: number) => resendInvite(id),
    onSuccess: invalidate,
  })
}

export function useRevokeInvite() {
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: (id: number) => revokeInvite(id),
    onSuccess: invalidate,
  })
}

export function useDeleteMember() {
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: (id: number) => deleteMember(id),
    onSuccess: invalidate,
  })
}

/** Edit a member's roles: diff against the current set, add the new, drop the gone. */
export function useUpdateMemberRoles() {
  const invalidate = useInvalidateMembers()
  return useMutation({
    mutationFn: async (input: { member: Member; roleIds: number[] }) => {
      const { member, roleIds } = input
      const next = new Set(roleIds)
      const toAdd = roleIds.filter((id) => !member.roleIds.includes(id))
      const toRemove = member.roleIds.filter((id) => !next.has(id))
      if (toAdd.length) await assignMemberRoles(member.id, toAdd)
      for (const id of toRemove) await unassignMemberRole(member.id, id)
    },
    onSuccess: invalidate,
  })
}
