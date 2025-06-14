import sqlite3
import sys

from snowflake import SnowflakeGenerator

from app.objects import Permissions, Role


def main(userId: int, roleId: int):
    conn = sqlite3.connect("ikocord.db")

    if not userId:
        cursor = conn.execute("SELECT * FROM members")
        rows = cursor.fetchall()
        print("-= Users =-")
        print(rows)

        cursor = conn.execute("SELECT * FROM roles")
        rows = cursor.fetchall()
        print("-= Roles =-")
        print(rows)
        conn.close()
        return

    cursor = conn.execute("SELECT * FROM members WHERE id = ?", (userId,))
    row = cursor.fetchone()
    if not row:
        raise ValueError("User not found")

    print("Creating admin role...")

    if not roleId:
        gen = SnowflakeGenerator(5)
        roleId = next(gen)

        role = Role(
            id=roleId,
            name="Admin",
            color="#ffd700",
            is_grad=False,
            secondary_color=None,
            permissions=Permissions(admin=True),
            icon_url=None,
            position=0,
        )

        cursor = conn.execute(
            """
            INSERT INTO roles (
                id,
                name,
                color,
                is_grad,
                secondary_color,
                permissions,
                icon_url,
                position
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
            (
                role.id,
                role.name,
                role.color.as_hex(),
                role.isGrad,
                role.secondaryColor,
                role.permissions.model_dump_json(),
                role.iconUrl,
                role.position,
            ),
        )
        conn.commit()

    conn.execute(
        """
        UPDATE members SET roles = ? WHERE id = ?
    """,
        (f"[{roleId}]", userId),
    )
    conn.commit()

    conn.close()


if __name__ == "__main__":
    main(
        int(sys.argv[1]) if len(sys.argv) >= 2 else None,
        int(sys.argv[2]) if len(sys.argv) >= 3 else None,
    )
