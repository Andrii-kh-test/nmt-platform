import { NextRequest, NextResponse } from "next/server";

import {
  TeacherApplicationStatus,
  TeacherStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";

import { prisma } from "@/app/lib/prisma";
import { hashPassword } from "@/app/lib/auth/password";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      password,
      role,
      institution,
      position,
      subject,
      locality,
    } = body;

    // =====================================================
    // VALIDATION
    // =====================================================

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        {
          error: "Заповніть усі обов'язкові поля.",
        },
        { status: 400 }
      );
    }

    if (typeof email !== "string") {
      return NextResponse.json(
        {
          error: "Некоректна електронна адреса.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        {
          error: "Введіть коректну електронну адресу.",
        },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        {
          error: "Пароль має містити щонайменше 8 символів.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // ROLE VALIDATION
    // =====================================================

    // Клієнт не може самостійно створити ADMIN або TEACHER.
    if (role !== "PARTICIPANT" && role !== "TEACHER") {
      return NextResponse.json(
        {
          error: "Некоректний тип реєстрації.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // CHECK EXISTING USER
    // =====================================================

    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "Користувач із такою електронною адресою вже існує.",
        },
        { status: 409 }
      );
    }

    // =====================================================
    // PASSWORD
    // =====================================================

    const passwordHash = await hashPassword(password);

    // =====================================================
    // TEACHER APPLICATION VALIDATION
    // =====================================================

    if (role === "TEACHER") {
      if (!institution || !position || !subject || !locality) {
        return NextResponse.json(
          {
            error:
              "Для подання заявки викладача заповніть усі додаткові поля.",
          },
          { status: 400 }
        );
      }
    }

    // =====================================================
    // CREATE USER
    // =====================================================

    const user = await prisma.$transaction(async (tx) => {
      /*
       * ВАЖЛИВО:
       *
       * Навіть якщо користувач надіслав role = TEACHER,
       * він НЕ отримує роль TEACHER.
       *
       * До схвалення адміністратором:
       *
       * role = PARTICIPANT
       * teacherStatus = PENDING
       */

      const createdUser = await tx.user.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: normalizedEmail,
          passwordHash,

          role: UserRole.PARTICIPANT,

          status: UserStatus.ACTIVE,

          teacherStatus:
            role === "TEACHER"
              ? TeacherStatus.PENDING
              : TeacherStatus.NONE,
        },
      });

      // ===================================================
      // PARTICIPANT
      // ===================================================

      await tx.participant.create({
  data: {
    userId: createdUser.id,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
  },
});

      // ===================================================
      // TEACHER APPLICATION
      // ===================================================

      if (role === "TEACHER") {
        await tx.teacherApplication.create({
  data: {
    userId: createdUser.id,

    firstName: firstName.trim(),
    lastName: lastName.trim(),

    institution: institution.trim(),
    position: position.trim(),
    subject: subject.trim(),
    locality: locality.trim(),

    status: TeacherApplicationStatus.PENDING,
  },
});
      }

      return createdUser;
    });

    // =====================================================
    // RESPONSE
    // =====================================================

    return NextResponse.json(
      {
        success: true,

        message:
          role === "TEACHER"
            ? "Реєстрацію завершено. Заявку на статус викладача передано адміністратору."
            : "Реєстрацію успішно завершено.",

        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          teacherStatus: user.teacherStatus,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("REGISTER_ERROR:", error);

    return NextResponse.json(
      {
        error: "Не вдалося зареєструвати користувача.",
      },
      { status: 500 }
    );
  }
}