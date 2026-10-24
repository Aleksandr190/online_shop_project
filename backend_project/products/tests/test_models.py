from django.test import TestCase
from decimal import Decimal
from products.models import Product

class ProductModelTest(TestCase):

    def setUp(self):
        # Создаем базовые тестовые данные, которые будут использоваться в тестах
        self.product1 = Product.objects.create(
            title="Тестовый товар 1",
            description="Описание товара 1",
            price=Decimal("999.99"),
            image="products/test1.jpg"
        )


    def test_product_creation(self):
        # Проверяем, что объект успешно создается и данные соответствуют заданным
        product = self.product1
        self.assertTrue(isinstance(product, Product))
        self.assertEqual(product.title, "Тестовый товар 1")
        self.assertEqual(product.price, Decimal("999.99"))
        self.assertEqual(product.description, "Описание товара 1")

    def test_string_representation(self):
        # Проверяем работу метода __str__
        product = self.product1
        self.assertEqual(str(product), product.title)    