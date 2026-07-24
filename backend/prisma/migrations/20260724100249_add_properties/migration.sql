-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "ownerPartyId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "propertyType" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "surfaceArea" REAL,
    "rooms" INTEGER,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "expectedRentalIncome" REAL,
    "expectedExpenses" REAL,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Property_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyDbId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PropertyImage_propertyDbId_fkey" FOREIGN KEY ("propertyDbId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RentalHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyDbId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "rentalIncome" REAL NOT NULL,
    "expenses" REAL,
    "occupancyRate" REAL,
    "netIncome" REAL,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RentalHistory_propertyDbId_fkey" FOREIGN KEY ("propertyDbId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PropertyDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "propertyDbId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "documentHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PropertyDocument_propertyDbId_fkey" FOREIGN KEY ("propertyDbId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_propertyId_key" ON "Property"("propertyId");
