async function initAuth(){
  const {data:{session}}=await supabaseClient.auth.getSession();

  const authPageEl=document.getElementById('authPage');
  const appPageEl=document.getElementById('appPage');

  if(session?.user){
    if(authPageEl && appPageEl){
      await handleAuthenticatedUser(session.user);
    }else if(!authPageEl && location.pathname.endsWith('login.html')){
      location.href='index.html';
    }
  }else{
    if(authPageEl && appPageEl){
      showAuthPage();
    }
  }

  supabaseClient.auth.onAuthStateChange(async(event,session)=>{
    if(['SIGNED_IN','TOKEN_REFRESHED','INITIAL_SESSION'].includes(event)&&session?.user){
      if(authPageEl && appPageEl){
        await handleAuthenticatedUser(session.user);
      }
    }

    if(event==='SIGNED_OUT' && authPageEl && appPageEl){
      currentUser=null;
      currentProfile=null;
      showAuthPage();
    }
  });
}

async function handleAuthenticatedUser(user){
  currentUser=user;
  currentProfile=await fetchOrCreateProfile(user);
  showAppPage();
  updateUIWithProfile();
  loadFeedPosts();
  loadPrayers();
  loadMembers();
}

async function fetchOrCreateProfile(user){
  let {data,error}=await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id',user.id)
    .single();

  if(data&&!error)return data;

  const p={
    id:user.id,
    full_name:user.user_metadata?.full_name||user.email?.split('@')[0]||'Believer',
    email:user.email,
    created_at:new Date().toISOString()
  };

  const r=await supabaseClient
    .from('profiles')
    .upsert(p)
    .select()
    .single();

  return r.data||p;
}

function showAuthPage(){
  const authPageEl=document.getElementById('authPage');
  const appPageEl=document.getElementById('appPage');

  if(authPageEl)authPageEl.classList.remove('hidden');
  if(appPageEl)appPageEl.classList.add('hidden');
}

function showAppPage(){
  const authPageEl=document.getElementById('authPage');
  const appPageEl=document.getElementById('appPage');

  if(authPageEl)authPageEl.classList.add('hidden');
  if(appPageEl)appPageEl.classList.remove('hidden');
}

const loginButton=document.getElementById('btnLogin');

if(loginButton){
  loginButton.onclick=async()=>{
    const msg=document.getElementById('loginMsg');

    if(msg)msg.innerText='';

    const {error}=await supabaseClient.auth.signInWithPassword({
      email:document.getElementById('loginEmail').value.trim(),
      password:document.getElementById('loginPassword').value
    });

    if(error){
      if(msg)msg.innerText=error.message;
    }else{
      if(!document.getElementById('appPage')){
        location.href='index.html';
      }
    }
  };
}

const registerButton=document.getElementById('btnRegister');

if(registerButton){
  registerButton.onclick=async()=>{
    const msg=document.getElementById('regMsg');

    if(msg){
      msg.className='msg-error';
      msg.innerText='';
    }

    const n=document.getElementById('regFullName').value.trim();
    const e=document.getElementById('regEmail').value.trim();
    const p=document.getElementById('regPassword').value;

    if(!n||!e||p.length<6){
      if(msg){
        msg.innerText=
          'Enter name, valid email and password of 6+ characters.';
      }
      return;
    }

    const {data,error}=await supabaseClient.auth.signUp({
      email:e,
      password:p,
      options:{
        data:{
          full_name:n
        }
      }
    });

    if(error){
      if(msg)msg.innerText=error.message;
    }else{
      if(msg){
        msg.className='msg-success';
        msg.innerText=data?.session
          ? 'Account created successfully. You can now log in.'
          : 'Account created. Check your email if confirmation is required.';
      }
    }
  };
}

const showRegisterButton=document.getElementById('btnShowRegister');

if(showRegisterButton){
  showRegisterButton.onclick=()=>{
    document.getElementById('loginCard')?.classList.add('hidden');
    document.getElementById('registerCard')?.classList.remove('hidden');
  };
}

const showLoginButton=document.getElementById('btnShowLogin');

if(showLoginButton){
  showLoginButton.onclick=()=>{
    document.getElementById('registerCard')?.classList.add('hidden');
    document.getElementById('loginCard')?.classList.remove('hidden');
  };
}

const logoutButton=document.getElementById('menuBtnLogout');

if(logoutButton){
  logoutButton.onclick=()=>{
    supabaseClient.auth.signOut();
  };
}

document.addEventListener('DOMContentLoaded',initAuth);