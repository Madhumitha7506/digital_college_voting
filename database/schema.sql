/* ===========================================================
   DIGITAL VOTING SYSTEM – DATABASE SCHEMA (for SQL Server)
   =========================================================== */

USE [DigitalVotingDB];
GO

-- 1️⃣ PROFILES TABLE
CREATE TABLE Profiles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Email NVARCHAR(255) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(255) NOT NULL,
    StudentId NVARCHAR(50) UNIQUE NOT NULL,
    Phone NVARCHAR(20) NOT NULL,
    IsVerified BIT DEFAULT 0,
    HasVoted BIT DEFAULT 0,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- 2️⃣ USER ROLES
CREATE TABLE UserRoles (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Role NVARCHAR(20) DEFAULT 'voter',
    CONSTRAINT FK_UserRoles_Profiles FOREIGN KEY (UserId)
        REFERENCES Profiles(Id) ON DELETE CASCADE
);
GO

-- 3️⃣ CANDIDATES
CREATE TABLE Candidates (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    Position NVARCHAR(50) NOT NULL,
    Manifesto NVARCHAR(MAX),
    PhotoUrl NVARCHAR(500),
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    UpdatedAt DATETIME2 DEFAULT SYSDATETIME()
);
GO

-- 4️⃣ VOTES
CREATE TABLE Votes (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    CandidateId INT NOT NULL,
    Position NVARCHAR(50) NOT NULL,
    VotedAt DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Votes_Profiles FOREIGN KEY (UserId)
        REFERENCES Profiles(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Votes_Candidates FOREIGN KEY (CandidateId)
        REFERENCES Candidates(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_User_Position UNIQUE (UserId, Position)
);
GO

-- 5️⃣ OTP VERIFICATIONS
CREATE TABLE OtpVerifications (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    OtpCode NVARCHAR(6) NOT NULL,
    Email NVARCHAR(255),
    Phone NVARCHAR(20),
    Verified BIT DEFAULT 0,
    ExpiresAt DATETIME2 NOT NULL,
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_OtpVerifications_Profiles FOREIGN KEY (UserId)
        REFERENCES Profiles(Id) ON DELETE CASCADE
);
GO

-- 6️⃣ FEEDBACK
CREATE TABLE Feedback (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    Suggestions NVARCHAR(MAX),
    CreatedAt DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Feedback_Profiles FOREIGN KEY (UserId)
        REFERENCES Profiles(Id) ON DELETE CASCADE
);
GO
