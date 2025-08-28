import { NextResponse, type NextRequest } from "next/server"
import { getSession } from "@/lib/auth"
import { createServerClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

// PATCH /api/users/[id] - update user (admin only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await getSession()
    if (!admin || admin.user_type !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const {
      email,
      password, // optional: if provided, update password_hash
      name,
      user_type,
      store_number,
      speciality,
      active,
    } = body || {}

    const supabase = createServerClient()

    const updatePayload: any = {}
    if (email !== undefined) updatePayload.email = email
    if (name !== undefined) updatePayload.name = name
    if (user_type !== undefined) updatePayload.user_type = user_type
    if (store_number !== undefined) updatePayload.store_number = store_number
    if (speciality !== undefined) updatePayload.speciality = speciality
    if (active !== undefined) updatePayload.active = !!active

    if (password) {
      updatePayload.password_hash = await bcrypt.hash(password, 10)
    }

    const { data, error } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", id)
      .select("id, email, name, user_type, store_number, speciality, active, created_at, updated_at")
      .single()

    if (error) {
      console.error("Erro ao atualizar usuário:", error)
      return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch (e) {
    console.error("Users PATCH error:", e)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE /api/users/[id] - delete user (admin only)
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await getSession()
    if (!admin || admin.user_type !== "admin") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = params
    const supabase = createServerClient()

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id)
      .single()

    if (error) {
      console.error("Erro ao excluir usuário:", error)
      return NextResponse.json({ error: "Erro ao excluir usuário" }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error("Users DELETE error:", e)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
