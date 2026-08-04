from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.models import User
from openai import OpenAI
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from .models import Conversation, ChatMessage
import markdown
from django.http import JsonResponse
import bleach
import markdown

ALLOWED_TAGS = [
    'p', 'br', 'strong', 'em', 'ul', 'ol', 'li',
    'pre', 'code', 'blockquote', 'a',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'hr',
]

ALLOWED_ATTRS = {
    'a': ['href', 'title', 'rel'],
    'code': ['class'],   # needed for hljs language classes like "language-python"
    'span': ['class'],
    'th': ['align'],
    'td': ['align'],
}

def render_ai_reply(raw_text: str) -> str:
    """Convert AI markdown to HTML, then strip anything dangerous."""
    html = markdown.markdown(
        raw_text,
        extensions=["extra", "codehilite", "fenced_code", "toc"],
    )
    clean_html = bleach.clean(
        html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        protocols=['http', 'https', 'mailto'],
        strip=True,          # remove disallowed tags instead of escaping them
    )
    return clean_html

# Create your views here.


client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=settings.NVIDIA_API_KEY
)


def login_user(request):
    if request.user.is_authenticated:
        return redirect('home')

    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')


        user = authenticate(
            request,
            username = username,
            password= password

        )

        if user is not None:
            login(request, user)
            return redirect('home')
        else:
            messages.error(request, "username or password does't conrrect")
    return render(request, 'chating/login.html')


def register_user(request):
    if request.method == 'POST':

        username = request.POST.get('username')

        email = request.POST.get('email')

        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        if password != confirm_password:
            messages.error(request, 'password do not match')
            return redirect('register')

        if User.objects.filter(username=username).exists():
            messages.error(request, 'already exists user')
            return redirect('register')

        if User.objects.filter(email=email).exists():
                messages.error(request, 'already exists email')
                return redirect('register')

        User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        messages.success(request, 'accout created succesfully')
        return redirect('login')
    return render(request, 'chating/register.html')
            



def logout_user(request):
    logout(request)
    return redirect('login')


@login_required
def home(request):
    # Show list of this user's conversations
    conversations = Conversation.objects.filter(user=request.user)
    return render(request, "chating/home.html", {"conversations": conversations})


@login_required
def new_chat(request):
    conversation = Conversation.objects.create(user=request.user, title="New Chat")
    return redirect("chat_room", conversation_id=conversation.id)


@login_required
def chat_room(request, conversation_id):
    conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    conversations = Conversation.objects.filter(user=request.user)

    if request.method == "POST":
        user_input = request.POST.get("message", "").strip()
        is_ajax = request.headers.get("X-Requested-With") == "XMLHttpRequest"

        if not user_input:
            if is_ajax:
                return JsonResponse({"error": "Please enter a message."}, status=400)
            messages.error(request, "Please enter a message.")
            return redirect("chat_room", conversation_id=conversation.id)

        try:
            completion = client.chat.completions.create(
                model="nvidia/nemotron-3-ultra-550b-a55b",
                messages=[{"role": "user", "content": user_input}],
                temperature=1,
                top_p=0.95,
                max_tokens=16384,
                extra_body={
                    "chat_template_kwargs": {"enable_thinking": True},
                    "reasoning_budget": 16384
                },
                stream=False
            )
            reply = completion.choices[0].message.content
        except Exception:
            if is_ajax:
                return JsonResponse({"error": "Something went wrong talking to the AI. Please try again."}, status=500)
            messages.error(request, "Something went wrong talking to the AI. Please try again.")
            return redirect("chat_room", conversation_id=conversation.id)

        ChatMessage.objects.create(
            conversation=conversation,
            user_input=user_input,
            reply=reply
        )

        if conversation.title == "New Chat":
            conversation.title = user_input[:40]
            conversation.save()

        if is_ajax:
            reply_html = render_ai_reply(reply)
            return JsonResponse({
                "user_input": user_input,
                "reply_html": reply_html,
            })

        return redirect("chat_room", conversation_id=conversation.id)

     
    # GET branch — rendering history
    chat_history = conversation.messages.all()
    for chat in chat_history:
        chat.reply_html = render_ai_reply(chat.reply)

    return render(request, "chating/chat_room.html", {
        "conversation": conversation,
        "conversations": conversations,
        "chat_history": chat_history
    })
 



@login_required
def delete_chat(request, conversation_id):
    conversation = get_object_or_404(Conversation, id=conversation_id, user=request.user)
    conversation.delete()
    return redirect("home")



