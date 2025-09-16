// Test script for the simple notification system
// Run this in your browser console while logged in

async function testNotificationSystem() {
    const API_BASE_URL = 'http://localhost:5000/api';
    
    // Get auth token
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('❌ No authentication token found. Please login first.');
        return;
    }
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    console.log('🔍 Testing Simple Notification System...\n');

    try {
        // Test 1: Get unread count
        console.log('📊 Test 1: Getting unread count...');
        const unreadResponse = await fetch(`${API_BASE_URL}/notifications/unread-count`, { headers });
        const unreadData = await unreadResponse.json();
        console.log('✅ Unread count:', unreadData.count || 0);

        // Test 2: Get notifications
        console.log('\n📋 Test 2: Getting notifications...');
        const notificationsResponse = await fetch(`${API_BASE_URL}/notifications?page=1&limit=10`, { headers });
        const notificationsData = await notificationsResponse.json();
        
        if (notificationsData.success) {
            console.log('✅ Notifications retrieved successfully!');
            console.log(`📄 Total notifications: ${notificationsData.data.length}`);
            
            notificationsData.data.forEach((notification, index) => {
                console.log(`\n📝 Notification ${index + 1}:`);
                console.log(`   Type: ${notification.type}`);
                console.log(`   Title: ${notification.title}`);
                console.log(`   Message: ${notification.message}`);
                console.log(`   Read: ${notification.isRead ? '✅' : '❌'}`);
                console.log(`   Task: ${notification.relatedTask.title}`);
                console.log(`   Created: ${new Date(notification.createdAt).toLocaleString()}`);
            });

            // Test 3: Mark first notification as read (if any)
            if (notificationsData.data.length > 0 && !notificationsData.data[0].isRead) {
                console.log('\n🔴 Test 3: Marking first notification as read...');
                const firstNotificationId = notificationsData.data[0]._id;
                const markReadResponse = await fetch(`${API_BASE_URL}/notifications/${firstNotificationId}/read`, {
                    method: 'PATCH',
                    headers
                });
                const markReadData = await markReadResponse.json();
                console.log('✅ Mark as read result:', markReadData.message);
            }

        } else {
            console.error('❌ Failed to get notifications:', notificationsData.message);
        }

    } catch (error) {
        console.error('❌ Error testing notification system:', error);
    }

    console.log('\n🎯 Test complete! Check the results above.');
}

// Instructions
console.log(`
🧪 NOTIFICATION SYSTEM TESTER

To test your notification system:
1. Make sure you're logged in
2. Run: testNotificationSystem()
3. Check the console output

Expected behavior:
- Should show unread count
- Should show notifications from TaskHistory
- Should be able to mark notifications as read
`);

// Auto-run the test
testNotificationSystem();