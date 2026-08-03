from django.contrib import admin
from .models import Conversation, ChatMessage

admin.site.register(Conversation)
admin.site.register(ChatMessage)