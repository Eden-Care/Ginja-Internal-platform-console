import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import {
  addRemark,
  approveSection,
  assignProvisioning,
  fetchProvisioning,
  fetchProvisioningDetail,
  fetchProvisioningMine,
  fetchRemarks,
  resolveRemark,
  saveSection,
  setStage,
  testSection,
  type ProvisioningQuery,
} from "./api"
import { provisioningKeys } from "./queries"
import type {
  AddRemarkRequest,
  SaveSectionRequest,
  SetStageRequest,
} from "./types"

/** The tenant provisioning queue (admin / reviewer dashboard). */
export function useProvisioning(q: ProvisioningQuery = {}, enabled = true) {
  return useQuery({
    queryKey: provisioningKeys.list(q),
    queryFn: () => fetchProvisioning(q),
    enabled,
  })
}

/** The caller's own provisioning assignments (engineer view). */
export function useProvisioningMine(enabled = true) {
  return useQuery({
    queryKey: provisioningKeys.mine(),
    queryFn: fetchProvisioningMine,
    enabled,
  })
}

/** One tenant's full provisioning detail (sections + config). */
export function useProvisioningDetail(tenantId: number | null) {
  return useQuery({
    queryKey: provisioningKeys.detail(tenantId ?? -1),
    queryFn: () => fetchProvisioningDetail(tenantId as number),
    enabled: tenantId != null,
  })
}

/** A tenant's technical-review remark trail. */
export function useRemarks(tenantId: number | null) {
  return useQuery({
    queryKey: provisioningKeys.remarks(tenantId ?? -1),
    queryFn: () => fetchRemarks(tenantId as number),
    enabled: tenantId != null,
  })
}

/** Invalidate everything touching one tenant's provisioning record. */
function invalidateTenant(
  qc: ReturnType<typeof useQueryClient>,
  tenantId: number
) {
  qc.invalidateQueries({ queryKey: provisioningKeys.detail(tenantId) })
  qc.invalidateQueries({ queryKey: provisioningKeys.remarks(tenantId) })
  qc.invalidateQueries({ queryKey: provisioningKeys.lists() })
  qc.invalidateQueries({ queryKey: provisioningKeys.mine() })
}

/* ----------------------------------------------------------- mutations --- */

export function useAssignProvisioning() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { tenantId: number; assignee: string }) =>
      assignProvisioning(v.tenantId, { assignee: v.assignee }),
    onSuccess: (_d, v) => invalidateTenant(qc, v.tenantId),
  })
}

export function useSaveSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: {
      tenantId: number
      section: string
      body: SaveSectionRequest
    }) => saveSection(v.tenantId, v.section, v.body),
    onSuccess: (_d, v) => invalidateTenant(qc, v.tenantId),
  })
}

export function useTestSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { tenantId: number; section: string }) =>
      testSection(v.tenantId, v.section),
    onSuccess: (_d, v) => invalidateTenant(qc, v.tenantId),
  })
}

export function useSetStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { tenantId: number; body: SetStageRequest }) =>
      setStage(v.tenantId, v.body),
    onSuccess: (_d, v) => invalidateTenant(qc, v.tenantId),
  })
}

export function useApproveSection() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { tenantId: number; section: string }) =>
      approveSection(v.tenantId, v.section),
    onSuccess: (_d, v) => invalidateTenant(qc, v.tenantId),
  })
}

export function useAddRemark() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: {
      tenantId: number
      section: string
      body: AddRemarkRequest
    }) => addRemark(v.tenantId, v.section, v.body),
    onSuccess: (_d, v) => invalidateTenant(qc, v.tenantId),
  })
}

export function useResolveRemark() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { tenantId: number; remarkId: string }) =>
      resolveRemark(v.remarkId),
    onSuccess: (_d, v) => invalidateTenant(qc, v.tenantId),
  })
}
