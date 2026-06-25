from fastapi import APIRouter, Depends, HTTPException
import httpx
from pydantic import BaseModel
from typing import Dict, Any, List
from app.config import get_settings

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

class DashboardStats(BaseModel):
    users_by_role: Dict[str, int]
    total_revenue: float
    total_products: int
    recent_sales: List[Dict[str, Any]]

@router.get("/stats")
async def get_dashboard_stats() -> Dict[str, Any]:
    settings = get_settings()
    
    headers = {
        "apikey": settings.SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_KEY}"
    }
    
    try:
        async with httpx.AsyncClient(base_url=settings.SUPABASE_URL, headers=headers) as client:
            # 1. Get users by role
            users_res = await client.get("/rest/v1/users?select=role")
            users_res.raise_for_status()
            users = users_res.json()
            users_by_role = {}
            for u in users:
                role = u.get("role")
                users_by_role[role] = users_by_role.get(role, 0) + 1
                
            # 2. Get total revenue
            sales_res = await client.get("/rest/v1/sales_records?select=total_amount")
            sales_res.raise_for_status()
            sales = sales_res.json()
            total_revenue = sum(s.get("total_amount", 0) for s in sales)
            
            # 3. Get total active products
            products_res = await client.get("/rest/v1/products?select=id&is_active=eq.true")
            products_res.raise_for_status()
            total_products = len(products_res.json())
            
            # 4. Get recent sales (last 5)
            recent_sales_res = await client.get("/rest/v1/sales_records?select=*,products(name),users(full_name)&order=created_at.desc&limit=5")
            recent_sales_res.raise_for_status()
            recent_sales = recent_sales_res.json()
            
            # 5. Get products list with stock
            stock_res = await client.get("/rest/v1/products?select=name,category,price,tier,stock_quantity&order=stock_quantity.asc")
            stock_res.raise_for_status()
            products_stock = stock_res.json()
            
            return {
                "status": "success",
                "data": {
                    "users_by_role": users_by_role,
                    "total_revenue": total_revenue,
                    "total_products": total_products,
                    "recent_sales": recent_sales,
                    "products_stock": products_stock
                }
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard stats: {str(e)}")
