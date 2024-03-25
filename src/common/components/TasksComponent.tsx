import { useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../../browser-extension/background'

const TasksComponent = () => {
    const { isSignedIn, user } = useUser()
    const [tasks, setTasks] = useState([])

    useEffect(() => {
        const fetchTasks = async () => {
            if (isSignedIn && user) {
                // 使用新的Firestore v9+语法
                const userTasksDocRef = doc(db, 'tasks', user.id)
                const docSnap = await getDoc(userTasksDocRef)
                if (docSnap.exists()) {
                    setTasks(docSnap.data().tasks)
                } else {
                    console.log('No such document!')
                }
            } else {
                // 从localStorage读取数据
                const localTasks = localStorage.getItem('tasks')
                if (localTasks) {
                    setTasks(JSON.parse(localTasks))
                }
            }
        }

        fetchTasks()
    }, [isSignedIn, user])

    const handleToggleTask = async (taskId) => {
        // 根据isSignedIn更新Firestore或localStorage
        // 这里需要你根据业务逻辑来实现任务勾选状态的更新
        // 示例更新Firestore文档
        if (isSignedIn && user) {
            const userTasksDocRef = doc(db, 'tasks', user.id)
            await updateDoc(userTasksDocRef, {
                // 假设你有一个tasks数组，你需要更新它
                // 注意：这里的更新逻辑需要你根据实际数据结构来定制
            })
        } else {
            // 更新localStorage
            // 同样，根据你的业务逻辑来实现
        }
    }

    // 渲染任务列表，勾选框等
    return <div>{/* 任务列表 */}</div>
}
