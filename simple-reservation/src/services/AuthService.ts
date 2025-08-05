import { 
  getAuth, 
  createUser, 
  setCustomUserClaims,
  getUserByEmail,
  updateUser
} from 'firebase-admin/auth';

import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc,
  Timestamp
} from 'firebase-admin/firestore';

import { 
  StaffUser, 
  StaffRegistrationData, 
  AuthResult,
  CustomClaims 
} from '../types/auth';

export class AuthService {
  private auth = getAuth();
  private db = getFirestore();
  private collectionName = 'staff';

  // スタッフ登録
  async registerStaff(data: StaffRegistrationData): Promise<AuthResult> {
    try {
      // Firebase Authにユーザー作成
      const userRecord = await createUser({
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        emailVerified: true
      });

      // カスタムクレーム設定
      const customClaims: CustomClaims = {
        staff: true,
        admin: data.role === 'admin',
        staffId: userRecord.uid
      };

      await setCustomUserClaims(userRecord.uid, customClaims);

      // Firestoreにスタッフ情報保存
      const staffUser: Omit<StaffUser, 'id'> = {
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await setDoc(
        doc(this.db, this.collectionName, userRecord.uid),
        staffUser
      );

      return {
        success: true,
        user: {
          id: userRecord.uid,
          ...staffUser
        }
      };

    } catch (error) {
      return {
        success: false,
        error: `スタッフ登録エラー: ${error instanceof Error ? error.message : '不明なエラー'}`
      };
    }
  }

  // スタッフ情報取得
  async getStaff(staffId: string): Promise<StaffUser | null> {
    try {
      const docRef = doc(this.db, this.collectionName, staffId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as StaffUser;
      }
      
      return null;
    } catch (error) {
      console.error('スタッフ情報取得エラー:', error);
      return null;
    }
  }

  // メールアドレスでスタッフ検索
  async getStaffByEmail(email: string): Promise<StaffUser | null> {
    try {
      const userRecord = await getUserByEmail(email);
      return await this.getStaff(userRecord.uid);
    } catch (error) {
      console.error('メールアドレスでのスタッフ検索エラー:', error);
      return null;
    }
  }

  // スタッフ情報更新
  async updateStaff(
    staffId: string, 
    updates: Partial<Pick<StaffUser, 'displayName' | 'role' | 'isActive'>>
  ): Promise<AuthResult> {
    try {
      // Firebase Auth更新
      if (updates.displayName) {
        await updateUser(staffId, {
          displayName: updates.displayName
        });
      }

      // カスタムクレーム更新（役割変更時）
      if (updates.role !== undefined) {
        const customClaims: CustomClaims = {
          staff: true,
          admin: updates.role === 'admin',
          staffId: staffId
        };
        await setCustomUserClaims(staffId, customClaims);
      }

      // Firestore更新
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      await updateDoc(
        doc(this.db, this.collectionName, staffId),
        updateData
      );

      // 更新後のスタッフ情報取得
      const updatedUser = await this.getStaff(staffId);

      return {
        success: true,
        user: updatedUser || undefined
      };

    } catch (error) {
      return {
        success: false,
        error: `スタッフ更新エラー: ${error instanceof Error ? error.message : '不明なエラー'}`
      };
    }
  }

  // スタッフ無効化（論理削除）
  async deactivateStaff(staffId: string): Promise<AuthResult> {
    return await this.updateStaff(staffId, { isActive: false });
  }

  // スタッフ有効化
  async activateStaff(staffId: string): Promise<AuthResult> {
    return await this.updateStaff(staffId, { isActive: true });
  }

  // 最終ログイン時刻更新
  async updateLastLogin(staffId: string): Promise<void> {
    try {
      await updateDoc(
        doc(this.db, this.collectionName, staffId),
        {
          lastLoginAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }
      );
    } catch (error) {
      console.error('最終ログイン時刻更新エラー:', error);
    }
  }

  // トークン検証とスタッフ情報取得
  async verifyStaffToken(idToken: string): Promise<StaffUser | null> {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      
      // スタッフ権限チェック
      if (!decodedToken.staff) {
        return null;
      }

      // スタッフ情報取得
      const staffUser = await this.getStaff(decodedToken.uid);
      
      // アクティブ状態チェック
      if (!staffUser || !staffUser.isActive) {
        return null;
      }

      // 最終ログイン時刻更新
      await this.updateLastLogin(decodedToken.uid);

      return staffUser;

    } catch (error) {
      console.error('トークン検証エラー:', error);
      return null;
    }
  }

  // 管理者権限チェック
  async isAdmin(staffId: string): Promise<boolean> {
    const staff = await this.getStaff(staffId);
    return staff?.role === 'admin' && staff?.isActive === true;
  }

  // 全スタッフ一覧取得（管理者用）
  async getAllStaff(): Promise<StaffUser[]> {
    try {
      const querySnapshot = await this.db.collection(this.collectionName).get();
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as StaffUser));
    } catch (error) {
      console.error('全スタッフ一覧取得エラー:', error);
      return [];
    }
  }
}