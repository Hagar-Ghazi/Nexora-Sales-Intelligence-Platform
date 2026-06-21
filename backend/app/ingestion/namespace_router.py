def get_target_collections(access_roles: list[str]) -> list[str]:
    """
    Maps logical access roles to physical Qdrant collection names.
    This ensures data is properly isolated by role.
    """
    collections = set()
    
    # If it's a public document (all roles)
    if "public" in access_roles or "all" in access_roles:
        collections.add("collection_public")
        
    if "sales" in access_roles:
        collections.add("collection_sales")
        
    if "support" in access_roles:
        collections.add("collection_support")
        
    if "manager" in access_roles:
        collections.add("collection_management")
        
    if "admin" in access_roles:
        collections.add("collection_admin")
        
    return list(collections)
