/* ===========================================================
   DIGITAL VOTING SYSTEM – SEED DATA (for SQL Server)
   =========================================================== */

USE [DigitalVotingDB];
GO

-- ADMIN user (password: admin123)
INSERT INTO Profiles (Email, PasswordHash, FullName, StudentId, Phone, IsVerified)
VALUES (
    'admin@votingsystem.com',
    '$2a$10$xXJOHQbPz7FQnABvD9xkkeGJQO8ygP.YxF3u4.TqKC8XZ5jkWCG8K',
    'System Admin',
    'ADMIN001',
    '+1234567890',
    1
);
DECLARE @AdminId INT = SCOPE_IDENTITY();

INSERT INTO UserRoles (UserId, Role) VALUES (@AdminId, 'admin');
GO

-- Sample candidates
INSERT INTO Candidates (Name, Position, Manifesto, PhotoUrl) VALUES
('John Smith', 'president', 'Committed to enhancing student welfare and academic excellence.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400'),
('Sarah Johnson', 'president', 'Passionate about sustainability and student rights.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400'),
('Michael Chen', 'vice_president', 'Experienced leader with a vision for digital transformation.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400'),
('Emily Rodriguez', 'vice_president', 'Dedicated to fostering inclusivity and diversity.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400'),
('David Kim', 'secretary', 'Detail-oriented with strong organizational skills.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400'),
('Lisa Anderson', 'secretary', 'Committed to clear communication and accessibility.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2e?w=400'),
('James Wilson', 'treasurer', 'Finance major focused on budget transparency.', 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400'),
('Maria Garcia', 'treasurer', 'Passionate about financial literacy.', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400');
GO

-- Sample voter (password: voter123)
INSERT INTO Profiles (Email, PasswordHash, FullName, StudentId, Phone, IsVerified)
VALUES (
    'voter@example.com',
    '$2a$10$4EqfZ1gN8CJqFmkfVxJe7.9eXjO5J4c5N6fO1qK7xCK9Z5jkWCG8K',
    'Test Voter',
    'STU001',
    '+1234567891',
    1
);
DECLARE @VoterId INT = SCOPE_IDENTITY();

INSERT INTO UserRoles (UserId, Role) VALUES (@VoterId, 'voter');
GO
