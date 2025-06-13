import aiosqlite


class DBService:
    conn: aiosqlite.Connection = None

    @classmethod
    async def init(cls):
        cls.conn = await aiosqlite.connect("ikocord.db")
        cls.conn.row_factory = aiosqlite.Row
