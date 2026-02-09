"""
StyleSwap Python SDK

Official SDK for integrating StyleSwap virtual try-on API into Python applications

Installation:
pip install styleswap-sdk

Usage:
from styleswap import StyleSwapClient

client = StyleSwapClient(
    client_id='your_client_id',
    client_secret='your_client_secret'
)

# Upload photo
photo = client.upload_photo('path/to/photo.jpg')

# Generate try-on
tryon = client.generate_tryon(
    photo_id=photo['photo_id'],
    product_id='prod_123',
    size='M',
    color='Blue',
    garment_part='top'
)

# Wait for completion
result = client.wait_for_tryon(tryon['tryon_id'])
print(f"Try-on result: {result['result_url']}")
"""

import requests
import time
import base64
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta


class StyleSwapClient:
    """
    StyleSwap API Client for Python
    
    Provides easy-to-use methods for interacting with the StyleSwap API
    """
    
    def __init__(
        self,
        client_id: str,
        client_secret: str,
        base_url: str = 'https://api.styleswap.com/v1',
        timeout: int = 30
    ):
        """
        Initialize StyleSwap client
        
        Args:
            client_id: Your StyleSwap API client ID
            client_secret: Your StyleSwap API client secret
            base_url: Base URL for the API (default: production)
            timeout: Request timeout in seconds
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = base_url
        self.timeout = timeout
        self.access_token: Optional[str] = None
        self.token_expiry: Optional[datetime] = None
        
    def _get_access_token(self) -> str:
        """
        Get or refresh access token
        
        Returns:
            Access token string
        """
        # Return cached token if still valid
        if self.access_token and self.token_expiry and datetime.now() < self.token_expiry:
            return self.access_token
        
        # Request new token
        response = requests.post(
            f'{self.base_url}/auth/token',
            json={
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'grant_type': 'client_credentials'
            },
            timeout=self.timeout
        )
        response.raise_for_status()
        
        data = response.json()
        self.access_token = data['access_token']
        self.token_expiry = datetime.now() + timedelta(seconds=data['expires_in'] - 60)
        
        return self.access_token
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Make an authenticated API request
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint path
            **kwargs: Additional arguments to pass to requests
            
        Returns:
            Response JSON data
        """
        token = self._get_access_token()
        headers = kwargs.pop('headers', {})
        headers['Authorization'] = f'Bearer {token}'
        
        url = f'{self.base_url}{endpoint}'
        response = requests.request(
            method,
            url,
            headers=headers,
            timeout=self.timeout,
            **kwargs
        )
        response.raise_for_status()
        
        return response.json()
    
    # ========================================================================
    # HEALTH CHECK
    # ========================================================================
    
    def health(self) -> Dict[str, Any]:
        """
        Check API health status
        
        Returns:
            Health status information
        """
        return self._make_request('GET', '/auth/health')
    
    # ========================================================================
    # PRODUCT MANAGEMENT
    # ========================================================================
    
    def create_product(self, **product_data) -> Dict[str, Any]:
        """
        Create a new product
        
        Args:
            **product_data: Product information (name, price, image_url, etc.)
            
        Returns:
            Created product data
        """
        return self._make_request('POST', '/products', json=product_data)
    
    def get_product(self, product_id: str) -> Dict[str, Any]:
        """
        Get a product by ID
        
        Args:
            product_id: Product ID
            
        Returns:
            Product data
        """
        return self._make_request('GET', f'/products/{product_id}')
    
    def update_product(self, product_id: str, **updates) -> Dict[str, Any]:
        """
        Update a product
        
        Args:
            product_id: Product ID
            **updates: Fields to update
            
        Returns:
            Updated product data
        """
        return self._make_request('PUT', f'/products/{product_id}', json=updates)
    
    def list_products(
        self,
        page: int = 1,
        limit: int = 50,
        category: Optional[str] = None,
        is_active: Optional[bool] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        List products with pagination and filtering
        
        Args:
            page: Page number
            limit: Items per page
            category: Filter by category
            is_active: Filter by active status
            search: Search query
            
        Returns:
            Paginated product list
        """
        params = {
            'page': page,
            'limit': limit
        }
        if category:
            params['category'] = category
        if is_active is not None:
            params['is_active'] = is_active
        if search:
            params['search'] = search
        
        return self._make_request('GET', '/products', params=params)
    
    def bulk_upload_products(
        self,
        csv_data: str,
        update_existing: bool = False
    ) -> Dict[str, Any]:
        """
        Bulk upload products via CSV
        
        Args:
            csv_data: CSV data as string
            update_existing: Whether to update existing products
            
        Returns:
            Bulk upload job information
        """
        return self._make_request(
            'POST',
            '/products/bulk-upload',
            json={
                'csv_data': csv_data,
                'update_existing': update_existing
            }
        )
    
    def get_bulk_upload_status(self, job_id: str) -> Dict[str, Any]:
        """
        Check bulk upload status
        
        Args:
            job_id: Bulk upload job ID
            
        Returns:
            Job status information
        """
        return self._make_request('GET', f'/products/bulk-upload/{job_id}')
    
    def delete_product(self, product_id: str) -> Dict[str, Any]:
        """
        Delete a product
        
        Args:
            product_id: Product ID
            
        Returns:
            Deletion confirmation
        """
        return self._make_request('DELETE', f'/products/{product_id}')
    
    # ========================================================================
    # TRY-ON GENERATION
    # ========================================================================
    
    def upload_photo(
        self,
        photo_path: str,
        customer_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Upload a customer photo
        
        Args:
            photo_path: Path to photo file
            customer_id: Optional customer ID
            metadata: Optional metadata
            
        Returns:
            Photo information
        """
        # Read and encode photo
        with open(photo_path, 'rb') as f:
            photo_base64 = base64.b64encode(f.read()).decode('utf-8')
        
        return self._make_request(
            'POST',
            '/tryons/upload-photo',
            json={
                'photo_base64': photo_base64,
                'customer_id': customer_id,
                'metadata': metadata
            }
        )
    
    def generate_tryon(
        self,
        photo_id: str,
        product_id: str,
        size: str,
        color: str,
        garment_part: str,
        customer_id: Optional[str] = None,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a virtual try-on
        
        Args:
            photo_id: Photo ID from upload
            product_id: Product ID
            size: Size to try
            color: Color to try
            garment_part: 'top' or 'bottom'
            customer_id: Optional customer ID
            session_id: Optional session ID
            metadata: Optional metadata
            
        Returns:
            Try-on generation information
        """
        return self._make_request(
            'POST',
            '/tryons/generate',
            json={
                'photo_id': photo_id,
                'product_id': product_id,
                'size': size,
                'color': color,
                'garment_part': garment_part,
                'customer_id': customer_id,
                'session_id': session_id,
                'metadata': metadata
            }
        )
    
    def get_tryon_result(self, tryon_id: str) -> Dict[str, Any]:
        """
        Get try-on result
        
        Args:
            tryon_id: Try-on ID
            
        Returns:
            Try-on result data
        """
        return self._make_request('GET', f'/tryons/{tryon_id}')
    
    def wait_for_tryon(
        self,
        tryon_id: str,
        max_wait_time: int = 300,
        poll_interval: int = 2
    ) -> Dict[str, Any]:
        """
        Wait for try-on completion
        
        Args:
            tryon_id: Try-on ID
            max_wait_time: Maximum wait time in seconds
            poll_interval: Poll interval in seconds
            
        Returns:
            Completed try-on result
            
        Raises:
            TimeoutError: If try-on takes too long
            RuntimeError: If try-on generation fails
        """
        start_time = time.time()
        
        while time.time() - start_time < max_wait_time:
            result = self.get_tryon_result(tryon_id)
            
            if result['status'] == 'completed':
                return result
            elif result['status'] == 'failed':
                raise RuntimeError(f"Try-on failed: {result.get('error_message')}")
            
            time.sleep(poll_interval)
        
        raise TimeoutError(f"Try-on generation timed out after {max_wait_time}s")
    
    def list_tryons(
        self,
        customer_id: Optional[str] = None,
        product_id: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        List try-ons with filtering
        
        Args:
            customer_id: Filter by customer
            product_id: Filter by product
            status: Filter by status (processing, completed, failed)
            page: Page number
            limit: Items per page
            
        Returns:
            Paginated try-on list
        """
        params = {'page': page, 'limit': limit}
        if customer_id:
            params['customer_id'] = customer_id
        if product_id:
            params['product_id'] = product_id
        if status:
            params['status'] = status
        
        return self._make_request('GET', '/tryons', params=params)
    
    def save_tryon(
        self,
        tryon_id: str,
        customer_id: str,
        collection_name: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Save a try-on
        
        Args:
            tryon_id: Try-on ID
            customer_id: Customer ID
            collection_name: Optional collection name
            notes: Optional notes
            
        Returns:
            Save confirmation
        """
        return self._make_request(
            'POST',
            f'/tryons/{tryon_id}/save',
            json={
                'customer_id': customer_id,
                'collection_name': collection_name,
                'notes': notes
            }
        )
    
    def share_tryon(
        self,
        tryon_id: str,
        expiration_days: int = 7,
        allow_download: bool = True,
        message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Share a try-on
        
        Args:
            tryon_id: Try-on ID
            expiration_days: Days until share link expires
            allow_download: Whether to allow downloads
            message: Optional share message
            
        Returns:
            Share link information
        """
        return self._make_request(
            'POST',
            f'/tryons/{tryon_id}/share',
            json={
                'expiration_days': expiration_days,
                'allow_download': allow_download,
                'message': message
            }
        )
    
    def delete_tryon(self, tryon_id: str) -> Dict[str, Any]:
        """
        Delete a try-on
        
        Args:
            tryon_id: Try-on ID
            
        Returns:
            Deletion confirmation
        """
        return self._make_request('DELETE', f'/tryons/{tryon_id}')
    
    # ========================================================================
    # CUSTOMER MANAGEMENT
    # ========================================================================
    
    def create_customer(self, **customer_data) -> Dict[str, Any]:
        """
        Create a new customer
        
        Args:
            **customer_data: Customer information
            
        Returns:
            Created customer data
        """
        return self._make_request('POST', '/customers', json=customer_data)
    
    def get_customer(self, customer_id: str) -> Dict[str, Any]:
        """
        Get customer details
        
        Args:
            customer_id: Customer ID
            
        Returns:
            Customer data
        """
        return self._make_request('GET', f'/customers/{customer_id}')
    
    def update_customer(self, customer_id: str, **updates) -> Dict[str, Any]:
        """
        Update customer information
        
        Args:
            customer_id: Customer ID
            **updates: Fields to update
            
        Returns:
            Updated customer data
        """
        return self._make_request('PUT', f'/customers/{customer_id}', json=updates)
    
    def list_customers(
        self,
        page: int = 1,
        limit: int = 50,
        country: Optional[str] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        List customers with pagination
        
        Args:
            page: Page number
            limit: Items per page
            country: Filter by country
            search: Search query
            
        Returns:
            Paginated customer list
        """
        params = {'page': page, 'limit': limit}
        if country:
            params['country'] = country
        if search:
            params['search'] = search
        
        return self._make_request('GET', '/customers', params=params)
    
    # ========================================================================
    # ANALYTICS
    # ========================================================================
    
    def get_account_analytics(
        self,
        date_from: str,
        date_to: str,
        granularity: str = 'daily'
    ) -> Dict[str, Any]:
        """
        Get account-level analytics
        
        Args:
            date_from: Start date (ISO 8601)
            date_to: End date (ISO 8601)
            granularity: 'daily', 'weekly', or 'monthly'
            
        Returns:
            Analytics data
        """
        return self._make_request(
            'GET',
            '/analytics/account',
            params={
                'date_from': date_from,
                'date_to': date_to,
                'granularity': granularity
            }
        )
    
    def get_product_analytics(
        self,
        product_id: str,
        date_from: str,
        date_to: str
    ) -> Dict[str, Any]:
        """
        Get product-level analytics
        
        Args:
            product_id: Product ID
            date_from: Start date (ISO 8601)
            date_to: End date (ISO 8601)
            
        Returns:
            Analytics data
        """
        return self._make_request(
            'GET',
            f'/analytics/products/{product_id}',
            params={
                'date_from': date_from,
                'date_to': date_to
            }
        )
    
    def get_customer_analytics(self, customer_id: str) -> Dict[str, Any]:
        """
        Get customer-level analytics
        
        Args:
            customer_id: Customer ID
            
        Returns:
            Analytics data
        """
        return self._make_request('GET', f'/analytics/customers/{customer_id}')
