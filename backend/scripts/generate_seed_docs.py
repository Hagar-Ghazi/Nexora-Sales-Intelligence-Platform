import os

DOCS = {
    "product_catalog.md": """# Enterprise Widget
The Enterprise Widget is our flagship hardware product.
Price: $1200
SKU: EW-001
Features:
- 10x faster processing
- Military-grade encryption
- 24/7 priority support included

# Standard Widget
Price: $300
SKU: SW-001
Features:
- Reliable everyday performance
- Standard encryption
""",
    "return_policy.md": """# Return Policy
Customers can return any hardware product within 30 days of purchase for a full refund.
Software subscriptions are non-refundable after the first 7 days.
To initiate a return, support agents should use the RMA tool in the internal portal.
""",
    "troubleshooting_guide.md": """# Error Code 404 on Enterprise Widget
If a customer reports Error Code 404 on the Enterprise Widget, this indicates a firmware mismatch.
Steps to resolve:
1. Ask the customer to hold the power button for 10 seconds to hard reset.
2. Connect the widget to WiFi.
3. It will automatically download firmware v2.1.4.
4. If the issue persists, escalate to Tier 2 support.
"""
}

def generate_docs():
    output_dir = os.path.join(os.path.dirname(__file__), "..", "seed_documents")
    os.makedirs(output_dir, exist_ok=True)
    
    for filename, content in DOCS.items():
        filepath = os.path.join(output_dir, filename)
        with open(filepath, "w") as f:
            f.write(content)
            
    print(f"Generated {len(DOCS)} seed documents in {output_dir}")

if __name__ == "__main__":
    generate_docs()
