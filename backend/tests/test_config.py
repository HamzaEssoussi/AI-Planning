import os
import unittest

from core.config import Settings


class SettingsDatabaseConfigTests(unittest.TestCase):
    def test_database_url_defaults_to_postgres(self):
        settings = Settings()
        self.assertTrue(settings.DATABASE_URL.startswith("postgresql://"))

    def test_database_url_can_be_overridden(self):
        original = os.environ.get("DATABASE_URL")
        os.environ["DATABASE_URL"] = "postgresql://user:pass@db:5432/testdb"
        try:
            settings = Settings()
            self.assertEqual(settings.DATABASE_URL, "postgresql://user:pass@db:5432/testdb")
        finally:
            if original is None:
                os.environ.pop("DATABASE_URL", None)
            else:
                os.environ["DATABASE_URL"] = original


if __name__ == "__main__":
    unittest.main()
