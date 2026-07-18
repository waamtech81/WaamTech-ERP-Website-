/**
 * DEPRECATED as commercial SSOT.
 * Industry/category ID catalogs must come from License Engine public APIs
 * (`/api/v1/public/catalog/*`). This file retains presentation helpers only
 * (icon name maps + Unsplash image URLs) for UI chrome.
 *
 * Prefer: `useCatalogIndustries`, `useCatalogBusinessCategories`,
 * `useCatalogBusinessProfiles` from `@/hooks/use-commercial`.
 */

/** SaaS Core hierarchy — Industry (parent) → Business Category (child).
 * Source: WaamTech SaaS Core backend/src/config/businessProfiles
 * Signup sends industry_id + category_id; License Engine auto-resolves profile.
 */

export type PosMode = "required" | "optional" | "disabled";
export type MobileMode = "required" | "disabled";

export type BusinessIndustry = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  suite: string;
};

export type BusinessCategory = {
  id: string;
  name: string;
  industry_id: string;
  pos_mode: PosMode;
  mobile_mode: MobileMode;
  legacy_ids: string[];
};

export const businessIndustries: BusinessIndustry[] = [
  {
    "id": "automotive_vehicle",
    "name": "Automotive & Vehicle",
    "description": "Vehicles, parts, workshops, fleet, and related services.",
    "icon": "car",
    "color": "#1d4ed8",
    "suite": "vehicle_industry_suite"
  },
  {
    "id": "healthcare_pharmacy",
    "name": "Healthcare & Pharmacy",
    "description": "Pharmacies, medical stores, and healthcare retail.",
    "icon": "pill",
    "color": "#059669",
    "suite": "pharmacy_suite"
  },
  {
    "id": "real_estate_property",
    "name": "Real Estate & Property",
    "description": "Property sales, rentals, and estate management.",
    "icon": "building",
    "color": "#0f766e",
    "suite": "property_suite"
  },
  {
    "id": "manufacturing",
    "name": "Manufacturing",
    "description": "Production, assembly, BOM, and shop-floor operations.",
    "icon": "factory",
    "color": "#475569",
    "suite": "manufacturing_suite"
  },
  {
    "id": "retail_commerce",
    "name": "Retail & Commerce",
    "description": "Retail stores, grocery, electronics, and general commerce.",
    "icon": "store",
    "color": "#2563eb",
    "suite": "retail_suite"
  },
  {
    "id": "wholesale_distribution",
    "name": "Wholesale & Distribution",
    "description": "B2B wholesale and distribution channels.",
    "icon": "truck",
    "color": "#0369a1",
    "suite": "wholesale_suite"
  },
  {
    "id": "warehouse_logistics",
    "name": "Warehouse & Logistics",
    "description": "Warehousing, fulfillment, and logistics operations.",
    "icon": "warehouse",
    "color": "#334155",
    "suite": "warehouse_suite"
  },
  {
    "id": "restaurant_food_service",
    "name": "Restaurant & Food Service",
    "description": "Restaurants, cafes, bakeries, and food service.",
    "icon": "utensils",
    "color": "#dc2626",
    "suite": "restaurant_suite"
  },
  {
    "id": "education",
    "name": "Education",
    "description": "Schools, institutes, and education operations.",
    "icon": "graduation-cap",
    "color": "#7c3aed",
    "suite": "education_suite"
  },
  {
    "id": "hospital_medical",
    "name": "Hospital & Medical",
    "description": "Hospitals, clinics, and medical facilities.",
    "icon": "hospital",
    "color": "#0e7490",
    "suite": "hospital_suite"
  },
  {
    "id": "agriculture",
    "name": "Agriculture",
    "description": "Agriculture, fertilizer, and agribusiness.",
    "icon": "sprout",
    "color": "#65a30d",
    "suite": "agriculture_suite"
  },
  {
    "id": "textile_garments",
    "name": "Textile & Garments",
    "description": "Textiles, garments, and apparel businesses.",
    "icon": "shirt",
    "color": "#7e22ce",
    "suite": "textile_suite"
  },
  {
    "id": "furniture_interior",
    "name": "Furniture & Interior",
    "description": "Furniture retail, manufacturing, and interiors.",
    "icon": "sofa",
    "color": "#b45309",
    "suite": "furniture_suite"
  },
  {
    "id": "building_materials_hardware",
    "name": "Building Materials & Hardware",
    "description": "Hardware, tools, and building materials.",
    "icon": "brick-wall",
    "color": "#a16207",
    "suite": "building_materials_suite"
  },
  {
    "id": "beauty_cosmetics",
    "name": "Beauty & Cosmetics",
    "description": "Cosmetics retail, salons, and spas.",
    "icon": "sparkles",
    "color": "#db2777",
    "suite": "beauty_suite"
  },
  {
    "id": "pet_veterinary",
    "name": "Pet & Veterinary",
    "description": "Pet shops and veterinary businesses.",
    "icon": "paw-print",
    "color": "#c2410c",
    "suite": "pet_suite"
  },
  {
    "id": "water_management",
    "name": "Water Management",
    "description": "Water delivery, bottles, and utility operations.",
    "icon": "droplets",
    "color": "#0284c7",
    "suite": "water_management_suite"
  }
];

export const businessCategories: BusinessCategory[] = [
  {
    "id": "vehicle_manufacturing",
    "name": "Vehicle Manufacturing",
    "industry_id": "automotive_vehicle",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "auto_parts_manufacturing",
    "name": "Auto Parts Manufacturing",
    "industry_id": "automotive_vehicle",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "vehicle_dealership",
    "name": "Vehicle Dealership",
    "industry_id": "automotive_vehicle",
    "pos_mode": "optional",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "auto_parts_distribution",
    "name": "Auto Parts Distribution",
    "industry_id": "automotive_vehicle",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "auto_parts_wholesale",
    "name": "Auto Parts Wholesale",
    "industry_id": "automotive_vehicle",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "auto_parts_retail",
    "name": "Auto Parts Retail",
    "industry_id": "automotive_vehicle",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": [
      "auto_parts"
    ]
  },
  {
    "id": "auto_workshop_service",
    "name": "Auto Workshop & Service",
    "industry_id": "automotive_vehicle",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "tyre_business",
    "name": "Tyre Business",
    "industry_id": "automotive_vehicle",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "battery_business",
    "name": "Battery Business",
    "industry_id": "automotive_vehicle",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "lubricants_fluids",
    "name": "Lubricants & Fluids",
    "industry_id": "automotive_vehicle",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "vehicle_accessories",
    "name": "Vehicle Accessories",
    "industry_id": "automotive_vehicle",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "fleet_transport",
    "name": "Fleet & Transport",
    "industry_id": "automotive_vehicle",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "vehicle_rental",
    "name": "Vehicle Rental",
    "industry_id": "automotive_vehicle",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "vehicle_import_export",
    "name": "Vehicle Import & Export",
    "industry_id": "automotive_vehicle",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "vehicle_inspection_compliance",
    "name": "Vehicle Inspection & Compliance",
    "industry_id": "automotive_vehicle",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "roadside_assistance",
    "name": "Roadside Assistance",
    "industry_id": "automotive_vehicle",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "retail_pharmacy",
    "name": "Retail Pharmacy",
    "industry_id": "healthcare_pharmacy",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": [
      "pharmacy"
    ]
  },
  {
    "id": "chain_pharmacy",
    "name": "Chain Pharmacy",
    "industry_id": "healthcare_pharmacy",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "hospital_pharmacy",
    "name": "Hospital Pharmacy",
    "industry_id": "healthcare_pharmacy",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "medical_store",
    "name": "Medical Store",
    "industry_id": "healthcare_pharmacy",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "medical_supplies",
    "name": "Medical Supplies",
    "industry_id": "healthcare_pharmacy",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "drug_distributor",
    "name": "Drug Distributor",
    "industry_id": "healthcare_pharmacy",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "pharmaceutical_wholesaler",
    "name": "Pharmaceutical Wholesaler",
    "industry_id": "healthcare_pharmacy",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "pharmaceutical_manufacturer",
    "name": "Pharmaceutical Manufacturer",
    "industry_id": "healthcare_pharmacy",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "diagnostic_laboratory",
    "name": "Diagnostic Laboratory",
    "industry_id": "healthcare_pharmacy",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "clinic",
    "name": "Clinic",
    "industry_id": "healthcare_pharmacy",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "property_management",
    "name": "Property Management",
    "industry_id": "real_estate_property",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": [
      "property"
    ]
  },
  {
    "id": "property_developer",
    "name": "Property Developer",
    "industry_id": "real_estate_property",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "real_estate_agency",
    "name": "Real Estate Agency",
    "industry_id": "real_estate_property",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "residential_rental",
    "name": "Residential Rental",
    "industry_id": "real_estate_property",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "commercial_rental",
    "name": "Commercial Rental",
    "industry_id": "real_estate_property",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "apartment_management",
    "name": "Apartment Management",
    "industry_id": "real_estate_property",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "facility_management",
    "name": "Facility Management",
    "industry_id": "real_estate_property",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "housing_society",
    "name": "Housing Society",
    "industry_id": "real_estate_property",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "general_manufacturing",
    "name": "General Manufacturing",
    "industry_id": "manufacturing",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": [
      "manufacturing"
    ]
  },
  {
    "id": "food_manufacturing",
    "name": "Food Manufacturing",
    "industry_id": "manufacturing",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "textile_manufacturing",
    "name": "Textile Manufacturing",
    "industry_id": "manufacturing",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "furniture_manufacturing",
    "name": "Furniture Manufacturing",
    "industry_id": "manufacturing",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "chemical_manufacturing",
    "name": "Chemical Manufacturing",
    "industry_id": "manufacturing",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": [
      "chemical"
    ]
  },
  {
    "id": "plastic_manufacturing",
    "name": "Plastic Manufacturing",
    "industry_id": "manufacturing",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "steel_metal_manufacturing",
    "name": "Steel & Metal Manufacturing",
    "industry_id": "manufacturing",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "packaging_manufacturing",
    "name": "Packaging Manufacturing",
    "industry_id": "manufacturing",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "electronics_manufacturing",
    "name": "Electronics Manufacturing",
    "industry_id": "manufacturing",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "retail_store",
    "name": "Retail Store",
    "industry_id": "retail_commerce",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": [
      "general_retail"
    ]
  },
  {
    "id": "supermarket",
    "name": "Supermarket",
    "industry_id": "retail_commerce",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "hypermarket",
    "name": "Hypermarket",
    "industry_id": "retail_commerce",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "grocery_store",
    "name": "Grocery Store",
    "industry_id": "retail_commerce",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": [
      "grocery"
    ]
  },
  {
    "id": "convenience_store",
    "name": "Convenience Store",
    "industry_id": "retail_commerce",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "department_store",
    "name": "Department Store",
    "industry_id": "retail_commerce",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "chain_store",
    "name": "Chain Store",
    "industry_id": "retail_commerce",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "general_wholesale",
    "name": "General Wholesale",
    "industry_id": "wholesale_distribution",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": [
      "wholesale"
    ]
  },
  {
    "id": "import_distributor",
    "name": "Import Distributor",
    "industry_id": "wholesale_distribution",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "export_distributor",
    "name": "Export Distributor",
    "industry_id": "wholesale_distribution",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "fmcg_distributor",
    "name": "FMCG Distributor",
    "industry_id": "wholesale_distribution",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "regional_distributor",
    "name": "Regional Distributor",
    "industry_id": "wholesale_distribution",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": [
      "distribution"
    ]
  },
  {
    "id": "national_distributor",
    "name": "National Distributor",
    "industry_id": "wholesale_distribution",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "warehouse",
    "name": "Warehouse",
    "industry_id": "warehouse_logistics",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "distribution_center",
    "name": "Distribution Center",
    "industry_id": "warehouse_logistics",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "cold_storage",
    "name": "Cold Storage",
    "industry_id": "warehouse_logistics",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "fulfillment_center",
    "name": "Fulfillment Center",
    "industry_id": "warehouse_logistics",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "third_party_logistics",
    "name": "Third Party Logistics (3PL)",
    "industry_id": "warehouse_logistics",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": [
      "logistics"
    ]
  },
  {
    "id": "restaurant",
    "name": "Restaurant",
    "industry_id": "restaurant_food_service",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "cafe",
    "name": "Cafe",
    "industry_id": "restaurant_food_service",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "fast_food",
    "name": "Fast Food",
    "industry_id": "restaurant_food_service",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "bakery",
    "name": "Bakery",
    "industry_id": "restaurant_food_service",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "cloud_kitchen",
    "name": "Cloud Kitchen",
    "industry_id": "restaurant_food_service",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "catering",
    "name": "Catering",
    "industry_id": "restaurant_food_service",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "food_court",
    "name": "Food Court",
    "industry_id": "restaurant_food_service",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "school",
    "name": "School",
    "industry_id": "education",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": [
      "education"
    ]
  },
  {
    "id": "college",
    "name": "College",
    "industry_id": "education",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "university",
    "name": "University",
    "industry_id": "education",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "academy",
    "name": "Academy",
    "industry_id": "education",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "training_institute",
    "name": "Training Institute",
    "industry_id": "education",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "coaching_center",
    "name": "Coaching Center",
    "industry_id": "education",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "hospital",
    "name": "Hospital",
    "industry_id": "hospital_medical",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "medical_center",
    "name": "Medical Center",
    "industry_id": "hospital_medical",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "dental_clinic",
    "name": "Dental Clinic",
    "industry_id": "hospital_medical",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "diagnostic_center",
    "name": "Diagnostic Center",
    "industry_id": "hospital_medical",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "eye_clinic",
    "name": "Eye Clinic",
    "industry_id": "hospital_medical",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "veterinary_clinic",
    "name": "Veterinary Clinic",
    "industry_id": "hospital_medical",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": [
      "veterinary"
    ]
  },
  {
    "id": "farm",
    "name": "Farm",
    "industry_id": "agriculture",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": [
      "agriculture"
    ]
  },
  {
    "id": "livestock",
    "name": "Livestock",
    "industry_id": "agriculture",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "poultry",
    "name": "Poultry",
    "industry_id": "agriculture",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "dairy_farm",
    "name": "Dairy Farm",
    "industry_id": "agriculture",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "fertilizer_dealer",
    "name": "Fertilizer Dealer",
    "industry_id": "agriculture",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "seed_dealer",
    "name": "Seed Dealer",
    "industry_id": "agriculture",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "agri_supplier",
    "name": "Agri Supplier",
    "industry_id": "agriculture",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "garment_manufacturer",
    "name": "Garment Manufacturer",
    "industry_id": "textile_garments",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "garment_retail",
    "name": "Garment Retail",
    "industry_id": "textile_garments",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": [
      "garments"
    ]
  },
  {
    "id": "textile_mill",
    "name": "Textile Mill",
    "industry_id": "textile_garments",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": [
      "textile"
    ]
  },
  {
    "id": "fabric_wholesale",
    "name": "Fabric Wholesale",
    "industry_id": "textile_garments",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "boutique",
    "name": "Boutique",
    "industry_id": "textile_garments",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "furniture_manufacturer",
    "name": "Furniture Manufacturer",
    "industry_id": "furniture_interior",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "furniture_retail",
    "name": "Furniture Retail",
    "industry_id": "furniture_interior",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": [
      "furniture"
    ]
  },
  {
    "id": "interior_design",
    "name": "Interior Design",
    "industry_id": "furniture_interior",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "modular_kitchen",
    "name": "Modular Kitchen",
    "industry_id": "furniture_interior",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "office_furniture",
    "name": "Office Furniture",
    "industry_id": "furniture_interior",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "building_materials",
    "name": "Building Materials",
    "industry_id": "building_materials_hardware",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "hardware_store",
    "name": "Hardware Store",
    "industry_id": "building_materials_hardware",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": [
      "hardware"
    ]
  },
  {
    "id": "paint_store",
    "name": "Paint Store",
    "industry_id": "building_materials_hardware",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "sanitary_store",
    "name": "Sanitary Store",
    "industry_id": "building_materials_hardware",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "electrical_store",
    "name": "Electrical Store",
    "industry_id": "building_materials_hardware",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "glass_aluminium",
    "name": "Glass & Aluminium",
    "industry_id": "building_materials_hardware",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "cosmetics_store",
    "name": "Cosmetics Store",
    "industry_id": "beauty_cosmetics",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": [
      "cosmetics"
    ]
  },
  {
    "id": "beauty_salon",
    "name": "Beauty Salon",
    "industry_id": "beauty_cosmetics",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": [
      "salon"
    ]
  },
  {
    "id": "spa",
    "name": "Spa",
    "industry_id": "beauty_cosmetics",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "perfume_store",
    "name": "Perfume Store",
    "industry_id": "beauty_cosmetics",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "skincare_distributor",
    "name": "Skincare Distributor",
    "industry_id": "beauty_cosmetics",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "pet_shop",
    "name": "Pet Shop",
    "industry_id": "pet_veterinary",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": [
      "pet_store"
    ]
  },
  {
    "id": "pet_clinic",
    "name": "Pet Clinic",
    "industry_id": "pet_veterinary",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "veterinary_hospital",
    "name": "Veterinary Hospital",
    "industry_id": "pet_veterinary",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "pet_grooming",
    "name": "Pet Grooming",
    "industry_id": "pet_veterinary",
    "pos_mode": "required",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "water_utility",
    "name": "Water Utility",
    "industry_id": "water_management",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": [
      "water_management"
    ]
  },
  {
    "id": "water_supply_company",
    "name": "Water Supply Company",
    "industry_id": "water_management",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "water_treatment_plant",
    "name": "Water Treatment Plant",
    "industry_id": "water_management",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "water_distribution",
    "name": "Water Distribution",
    "industry_id": "water_management",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  },
  {
    "id": "metered_water_services",
    "name": "Metered Water Services",
    "industry_id": "water_management",
    "pos_mode": "disabled",
    "mobile_mode": "required",
    "legacy_ids": []
  }
];

/** Old marketing / signup profile ids → current business category ids */
export const legacyProfileMap: Record<string, string> = {
  "auto_parts": "auto_parts_retail",
  "pharmacy": "retail_pharmacy",
  "property": "property_management",
  "manufacturing": "general_manufacturing",
  "chemical": "chemical_manufacturing",
  "general_retail": "retail_store",
  "grocery": "grocery_store",
  "wholesale": "general_wholesale",
  "distribution": "regional_distributor",
  "logistics": "third_party_logistics",
  "education": "school",
  "veterinary": "veterinary_clinic",
  "agriculture": "farm",
  "garments": "garment_retail",
  "textile": "textile_mill",
  "furniture": "furniture_retail",
  "hardware": "hardware_store",
  "cosmetics": "cosmetics_store",
  "salon": "beauty_salon",
  "pet_store": "pet_shop",
  "water_management": "water_utility"
};


const categoryById = new Map(businessCategories.map((c) => [c.id, c]));
const industryById = new Map(businessIndustries.map((i) => [i.id, i]));

export function resolveBusinessCategoryId(profileOrLegacyId: string | null | undefined): string {
  const raw = String(profileOrLegacyId || "").trim();
  if (!raw) return "retail_store";
  if (categoryById.has(raw)) return raw;
  const mapped = legacyProfileMap[raw];
  if (mapped && categoryById.has(mapped)) return mapped;
  return "retail_store";
}

/** Resolve category only when code/slug/legacy id is known — never defaults to retail_store. */
export function findBusinessCategoryByKey(
  codeOrSlug: string | null | undefined
): BusinessCategory | null {
  const raw = String(codeOrSlug || "").trim();
  if (!raw) return null;
  const key = raw.toLowerCase().replace(/-/g, "_");
  if (categoryById.has(raw)) return categoryById.get(raw) || null;
  if (categoryById.has(key)) return categoryById.get(key) || null;
  const mapped = legacyProfileMap[raw] || legacyProfileMap[key];
  if (mapped && categoryById.has(mapped)) return categoryById.get(mapped) || null;
  return null;
}

export function getBusinessCategory(id: string) {
  return categoryById.get(resolveBusinessCategoryId(id));
}

export function getBusinessIndustry(id: string) {
  return industryById.get(String(id || "").trim()) || null;
}

export function getCategoriesForIndustry(industryId: string) {
  return businessCategories.filter((c) => c.industry_id === industryId);
}

export function getIndustryForCategory(categoryId: string) {
  const cat = getBusinessCategory(categoryId);
  if (!cat) return null;
  return getBusinessIndustry(cat.industry_id);
}

export function getBusinessHierarchy() {
  return businessIndustries.map((industry) => ({
    ...industry,
    categories: getCategoriesForIndustry(industry.id),
  }));
}

/** Main industries to promote on home, mega menu, and galleries */
export const featuredIndustryIds = [
  "retail_commerce",
  "automotive_vehicle",
  "healthcare_pharmacy",
  "restaurant_food_service",
  "manufacturing",
  "wholesale_distribution",
  "warehouse_logistics",
  "real_estate_property",
] as const;

/**
 * Primary business categories marked “Hot” in the industries mega menu.
 * Keep this list small — only flag the most common entry profiles.
 */
export const hotCategoryIds = new Set<string>([
  "retail_store",
  "supermarket",
  "grocery_store",
  "auto_parts_retail",
  "auto_workshop_service",
  "retail_pharmacy",
  "restaurant",
  "cafe",
  "general_manufacturing",
  "general_wholesale",
  "warehouse",
  "property_management",
]);

export function isHotCategory(
  category:
    | string
    | { id?: string | null; slug?: string | null; code?: string | null }
): boolean {
  if (typeof category === "string") {
    const key = category.trim().toLowerCase();
    return Boolean(key) && hotCategoryIds.has(key);
  }
  const keys = [category.id, category.slug, category.code]
    .map((v) => String(v || "").trim().toLowerCase())
    .filter(Boolean);
  return keys.some((k) => hotCategoryIds.has(k));
}

/** Lucide icon name overrides for SaaS Core icon keys */
export const industryIconMap: Record<string, string> = {
  car: "Car",
  pill: "Pill",
  building: "Building2",
  factory: "Factory",
  store: "Store",
  truck: "Truck",
  warehouse: "Warehouse",
  utensils: "UtensilsCrossed",
  "graduation-cap": "GraduationCap",
  hospital: "Hospital",
  sprout: "Sprout",
  shirt: "Shirt",
  sofa: "Armchair",
  "brick-wall": "BrickWall",
  sparkles: "Sparkles",
  "paw-print": "PawPrint",
  droplets: "Droplets",
};

export const industryImages: Record<string, { image: string; imageAlt: string }> = {
  automotive_vehicle: {
    image: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Automotive workshop and vehicle service bay",
  },
  healthcare_pharmacy: {
    image: "https://images.unsplash.com/photo-1576602976047-174e57a47881?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Pharmacy counter and medicine shelves",
  },
  real_estate_property: {
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Modern commercial property exterior",
  },
  manufacturing: {
    image: "https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Manufacturing production line",
  },
  retail_commerce: {
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Retail checkout and in-store commerce",
  },
  wholesale_distribution: {
    image: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Wholesale distribution warehouse aisle",
  },
  warehouse_logistics: {
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Warehouse logistics and pallet racks",
  },
  restaurant_food_service: {
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Restaurant kitchen and food service",
  },
  education: {
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Education campus and learning spaces",
  },
  hospital_medical: {
    image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Hospital and medical care facility",
  },
  agriculture: {
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Agriculture field and farming operations",
  },
  textile_garments: {
    image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Textile and garment production",
  },
  furniture_interior: {
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Furniture showroom interior",
  },
  building_materials_hardware: {
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Building materials and hardware yard",
  },
  beauty_cosmetics: {
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Beauty and cosmetics retail display",
  },
  pet_veterinary: {
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Pet care and veterinary clinic",
  },
  water_management: {
    image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fm=webp&fit=crop&w=1200&q=70",
    imageAlt: "Water bottles and delivery operations",
  },
};

export function getIndustryLucideIcon(industry: BusinessIndustry | { icon: string }) {
  return industryIconMap[industry.icon] || "Boxes";
}

import { optimizeImageUrl } from "@/lib/images";

/** Industry imagery — WebP via Unsplash helpers; width defaults to card size. */
export function getIndustryMedia(industryId: string, width = 640) {
  const raw =
    industryImages[industryId] || {
      image:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fm=webp&fit=crop&w=1200&q=70",
      imageAlt: "Business team reviewing operations",
    };
  return {
    image: optimizeImageUrl(raw.image, { width, quality: 70 }),
    imageAlt: raw.imageAlt,
  };
}

export function getFeaturedIndustries() {
  const featured = featuredIndustryIds
    .map((id) => getBusinessIndustry(id))
    .filter((i): i is BusinessIndustry => Boolean(i));
  const rest = businessIndustries.filter(
    (i) => !featuredIndustryIds.includes(i.id as (typeof featuredIndustryIds)[number])
  );
  return { featured, rest, all: [...featured, ...rest] };
}

export function getCategoryCount(industryId: string) {
  return getCategoriesForIndustry(industryId).length;
}

export const hierarchyStats = {
  industries: businessIndustries.length,
  categories: businessCategories.length,
} as const;

