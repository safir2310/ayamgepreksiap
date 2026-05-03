import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

// GET - Fetch all point vouchers (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all point vouchers with user info
    const vouchers = await db.pointVoucher.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      vouchers: vouchers.map((v) => ({
        ...v,
        userName: v.user.name,
        userEmail: v.user.email,
        user: undefined, // Remove nested user object
      })),
    })
  } catch (error) {
    console.error('Error fetching point vouchers:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data voucher' },
      { status: 500 }
    )
  }
}

// POST - Create new point voucher from product
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Check if user is admin
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, pointsRequired, productId, productName, productImage, order, active } = body

    // Validate required fields
    if (!name || !pointsRequired) {
      return NextResponse.json(
        { error: 'Nama dan poin yang dibutuhkan harus diisi' },
        { status: 400 }
      )
    }

    // Create point voucher
    const pointVoucher = await db.pointVoucher.create({
      data: {
        name,
        description: description || `${productName}`,
        pointsRequired: parseInt(pointsRequired),
        productId: productId,
        productName: productName,
        productImage: productImage,
        order: order ? parseInt(order) : 0,
        active: active !== undefined ? active : true,
        userId: decoded.userId,
        code: `PV-${Date.now().toString(36).toUpperCase().substr(2, 8).toUpperCase()}`, // Auto-generate code
      },
    })

    return NextResponse.json({
      success: true,
      pointVoucher: {
        id: pointVoucher.id,
        name: pointVoucher.name,
        description: pointVoucher.description,
        pointsRequired: pointVoucher.pointsRequired,
        productId: pointVoucher.productId,
        productName: pointVoucher.productName,
        productImage: pointVoucher.productImage,
        order: pointVoucher.order,
        active: pointVoucher.active,
        code: pointVoucher.code,
        createdAt: pointVoucher.createdAt,
      },
      userName: user.name,
    })
  } catch (error) {
    console.error('Error creating point voucher:', error)
    return NextResponse.json(
      { error: 'Gagal membuat voucher poin' },
      { status: 500 }
    )
  }
}
