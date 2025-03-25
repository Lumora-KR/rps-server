// API Testing Commands

// 1. Get Car Rental Enquiries
// curl -X GET "http://localhost:5000/api/car-rental-detail?page=1&limit=10"

// 2. Get Car Rental Enquiries with Status Filter
// curl -X GET "http://localhost:5000/api/car-rental-detail?page=1&limit=10&status=pending"

// 3. Get Car Rental Enquiries with Search
// curl -X GET "http://localhost:5000/api/car-rental-detail?page=1&limit=10&search=john"

// 4. Get Car Rental Enquiry by ID
// curl -X GET "http://localhost:5000/api/car-rental-detail/1"

// 5. Update Car Rental Enquiry
// curl -X PUT "http://localhost:5000/api/car-rental-detail/1" \
//   -H "Content-Type: application/json" \
//   -d '{
//     "name": "John Doe",
//     "email": "john@example.com",
//     "phone": "1234567890",
//     "pickupDate": "2023-06-15",
//     "returnDate": "2023-06-20",
//     "pickupLocation": "Delhi",
//     "returnLocation": "Delhi",
//     "status": "confirmed"
//   }'

// 6. Delete Car Rental Enquiry
// curl -X DELETE "http://localhost:5000/api/car-rental-detail/1"

// 7. Get Car Rental Chart Data
// curl -X GET "http://localhost:5000/api/car-rental-detail/stats/chart"

// 8. Get Hotel Enquiries
// curl -X GET "http://localhost:5000/api/hotel-enquiries?page=1&limit=10"

// 9. Get Hotel Enquiries with Status Filter
// curl -X GET "http://localhost:5000/api/hotel-enquiries?page=1&limit=10&status=pending"

// 10. Get Hotel Enquiries with Search
// curl -X GET "http://localhost:5000/api/hotel-enquiries?page=1&limit=10&search=john"

// 11. Get Hotel Enquiry by ID
// curl -X GET "http://localhost:5000/api/hotel-enquiries/1"

// 12. Update Hotel Enquiry
// curl -X PUT "http://localhost:5000/api/hotel-enquiries/1" \
//   -H "Content-Type: application/json" \
//   -d '{
//     "name": "John Doe",
//     "email": "john@example.com",
//     "phone": "1234567890",
//     "checkInDate": "2023-06-15",
//     "checkOutDate": "2023-06-20",
//     "guests": 2,
//     "rooms": 1,
//     "status": "confirmed"
//   }'

// 13. Delete Hotel Enquiry
// curl -X DELETE "http://localhost:5000/api/hotel-enquiries/1"

// 14. Get Hotel Enquiry Chart Data
// curl -X GET "http://localhost:5000/api/hotel-enquiries/stats/chart"
