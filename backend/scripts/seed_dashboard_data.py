import os
import uuid
import datetime
import urllib.parse
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

def main():
    # Load env variables
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dotenv_path = os.path.join(backend_dir, ".env")
    load_dotenv(dotenv_path)

    db_password = os.getenv("SUPABASE_DB_PASSWORD")
    if not db_password:
        print("[Error] SUPABASE_DB_PASSWORD not found in env.")
        return

    pwd = urllib.parse.quote_plus(db_password)
    db_url = f"postgresql://postgres.hmsdswtaszpgmzkqiaxe:{pwd}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"

    print("Connecting to database...")
    try:
        engine = create_engine(db_url)
        with engine.connect() as conn:
            # 1. Clean old mock records from sales_records and documents to prevent duplicate keys or clutter
            print("Cleaning old metrics records...")
            conn.execute(text("DELETE FROM sales_records;"))
            conn.execute(text("DELETE FROM documents;"))
            conn.execute(text("DELETE FROM products;"))
            
            # Ensure Alice is in the users table
            alice_id = "adf8e4d5-d48d-49cd-a1ff-0b4e439e6ed3"
            res = conn.execute(text("SELECT id FROM users WHERE id = :id"), {"id": alice_id}).fetchone()
            if not res:
                print("Seeding user Alice Smith...")
                conn.execute(text("""
                    INSERT INTO users (id, email, full_name, role, department, is_active)
                    VALUES (:id, 'alice@company.com', 'Alice Smith', 'sales', 'Enterprise Sales', true)
                """), {"id": alice_id})

            # 2. Seed Products
            print("Seeding Products...")
            products = [
                {"id": str(uuid.uuid4()), "name": "Enterprise Widget Pro", "category": "Hardware", "price": 1500.00, "tier": "Enterprise", "stock_quantity": 12, "is_active": True},
                {"id": str(uuid.uuid4()), "name": "Standard Widget", "category": "Hardware", "price": 350.00, "tier": "Standard", "stock_quantity": 420, "is_active": True},
                {"id": str(uuid.uuid4()), "name": "Cloud Storage 1TB", "category": "Software", "price": 120.00, "tier": "Basic", "stock_quantity": 1500, "is_active": True},
                {"id": str(uuid.uuid4()), "name": "Nexora AI Assistant Suite", "category": "Software", "price": 2500.00, "tier": "Enterprise", "stock_quantity": 9999, "is_active": True},
                {"id": str(uuid.uuid4()), "name": "24/7 Premium Support", "category": "Service", "price": 600.00, "tier": "Premium", "stock_quantity": 9999, "is_active": True},
                {"id": str(uuid.uuid4()), "name": "Security Audit Consult", "category": "Service", "price": 5000.00, "tier": "Custom", "stock_quantity": 5, "is_active": True},
                {"id": str(uuid.uuid4()), "name": "Developer SDK License", "category": "Software", "price": 850.00, "tier": "Developer", "stock_quantity": 18, "is_active": True},
                {"id": str(uuid.uuid4()), "name": "Legacy Connector Mod", "category": "Hardware", "price": 180.00, "tier": "Legacy", "stock_quantity": 0, "is_active": False}
            ]

            for p in products:
                conn.execute(text("""
                    INSERT INTO products (id, name, category, price, tier, stock_quantity, is_active)
                    VALUES (:id, :name, :category, :price, :tier, :stock_quantity, :is_active)
                """), p)

            # 3. Seed Sales Records
            print("Seeding Sales Records...")
            now = datetime.datetime.now(datetime.timezone.utc)
            
            # Map products by category/index
            hardware_p = [p for p in products if p["category"] == "Hardware"]
            software_p = [p for p in products if p["category"] == "Software"]
            service_p = [p for p in products if p["category"] == "Service"]

            sales_reps = [alice_id]
            regions = ["North America", "Europe", "Asia", "LATAM"]
            statuses = ["completed", "completed", "completed", "pending", "cancelled"]
            customers = [
                ("Acme Corporation", "billing@acme.com"),
                ("Globex Corporation", "finance@globex.com"),
                ("Initech LLC", "accounts@initech.com"),
                ("Umbrella Corp", "procurement@umbrella.com"),
                ("Hooli Inc", "billing@hooli.xyz"),
                ("Soylent Industries", "admin@soylent.org"),
                ("Veerdyne Systems", "veerd@veerdyne.com"),
                ("Tyrell Corp", "replicants@tyrell.com")
            ]

            # Generate ~35 sales records over the last 6 months
            sales_count = 0
            for i in range(35):
                day_offset = i * 5
                sale_date = now - datetime.timedelta(days=day_offset)
                
                # Pick product
                if i % 3 == 0:
                    prod = hardware_p[i % len(hardware_p)]
                elif i % 3 == 1:
                    prod = software_p[i % len(software_p)]
                else:
                    prod = service_p[i % len(service_p)]

                qty = (i % 5) + 1
                unit_p = prod["price"]
                total = unit_p * qty
                status = statuses[i % len(statuses)]
                region = regions[i % len(regions)]
                cust = customers[i % len(customers)]
                rep = sales_reps[i % len(sales_reps)]

                conn.execute(text("""
                    INSERT INTO sales_records (id, product_id, sales_rep_id, customer_name, customer_email, quantity, unit_price, total_amount, region, status, sale_date, created_at)
                    VALUES (:id, :product_id, :sales_rep_id, :customer_name, :customer_email, :quantity, :unit_price, :total_amount, :region, :status, :sale_date, :created_at)
                """), {
                    "id": str(uuid.uuid4()),
                    "product_id": prod["id"],
                    "sales_rep_id": rep,
                    "customer_name": cust[0],
                    "customer_email": cust[1],
                    "quantity": qty,
                    "unit_price": unit_p,
                    "total_amount": total,
                    "region": region,
                    "status": status,
                    "sale_date": sale_date,
                    "created_at": sale_date
                })
                sales_count += 1

            # 4. Seed Documents Metadata (Technical Support Dashboard Telemetry)
            print("Seeding Documents registry...")
            docs = [
                {"id": str(uuid.uuid4()), "filename": "security_policy_2026.pdf", "file_type": "PDF", "file_size_bytes": 10485760, "storage_path": "/docs/security_policy_2026.pdf", "access_roles": ["admin", "manager", "support", "sales"], "document_type": "Security Policy", "content_hash": "a1b2c3d4e5", "chunk_count": 128, "status": "ingested"},
                {"id": str(uuid.uuid4()), "filename": "sales_playbook_q2.docx", "file_type": "DOCX", "file_size_bytes": 2048000, "storage_path": "/docs/sales_playbook_q2.docx", "access_roles": ["admin", "manager", "sales"], "document_type": "Sales Guide", "content_hash": "f6g7h8i9j0", "chunk_count": 45, "status": "ingested"},
                {"id": str(uuid.uuid4()), "filename": "api_reference_v3.pdf", "file_type": "PDF", "file_size_bytes": 4587520, "storage_path": "/docs/api_reference_v3.pdf", "access_roles": ["admin", "manager", "support"], "document_type": "API Documentation", "content_hash": "k1l2m3n4o5", "chunk_count": 210, "status": "ingested"},
                {"id": str(uuid.uuid4()), "filename": "customer_onboarding.csv", "file_type": "CSV", "file_size_bytes": 512000, "storage_path": "/docs/customer_onboarding.csv", "access_roles": ["admin", "manager"], "document_type": "Customer Data", "content_hash": "p6q7r8s9t0", "chunk_count": 12, "status": "ingested"},
                {"id": str(uuid.uuid4()), "filename": "technical_troubleshooting_hub.pdf", "file_type": "PDF", "file_size_bytes": 12582912, "storage_path": "/docs/troubleshoot.pdf", "access_roles": ["admin", "support"], "document_type": "Troubleshooting Guideline", "content_hash": "u1v2w3x4y5", "chunk_count": 150, "status": "ingested"},
                {"id": str(uuid.uuid4()), "filename": "unstructured_raw_feedback.txt", "file_type": "TXT", "file_size_bytes": 85000, "storage_path": "/docs/feedback.txt", "access_roles": ["admin", "manager", "support"], "document_type": "Unstructured Feedback", "content_hash": "z1a2b3c4d5", "chunk_count": 5, "status": "processing"},
                {"id": str(uuid.uuid4()), "filename": "corrupted_firmware_logs.log", "file_type": "LOG", "file_size_bytes": 24576000, "storage_path": "/docs/corrupted_logs.log", "access_roles": ["admin", "support"], "document_type": "System Log", "content_hash": "e6f7g8h9i0", "chunk_count": 0, "status": "failed"}
            ]

            for d in docs:
                conn.execute(text("""
                    INSERT INTO documents (id, filename, file_type, file_size_bytes, storage_path, access_roles, document_type, content_hash, chunk_count, status)
                    VALUES (:id, :filename, :file_type, :file_size_bytes, :storage_path, :access_roles, :document_type, :content_hash, :chunk_count, :status)
                """), d)

            conn.commit()
            print("Seeding completed successfully!")
            print(f"  - Products seeded: {len(products)}")
            print(f"  - Sales records seeded: {sales_count}")
            print(f"  - Documents seeded: {len(docs)}")

    except Exception as e:
        print("[Error] during database seeding:", str(e))

if __name__ == "__main__":
    main()
