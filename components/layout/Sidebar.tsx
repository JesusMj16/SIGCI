import {auth} from '@/auth'
import { getNavForRole } from '@/lib/nav'
import { SidebarNav } from './SidebarNav'

export async function Sidebar(){
    const session = await auth(); /*Cremos nuestra session*/
    if(!session?.user?.role) return null /*verificamos que exista session */ 
    const item = getNavForRole(session.user.role) /*Obtenemos los items con la estructura: label, href, icon*/

    return(
        <aside className="w-64 border-r bg-neutral text-neutral-foreground p-4">
            <h2 className="font-heading font-bold mb-6">SIGCI</h2>
            <SidebarNav items={item} />
        </aside>
    )
}