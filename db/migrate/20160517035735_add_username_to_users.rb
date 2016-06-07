class AddUsernameToUsers < ActiveRecord::Migration
  def change
    add_column  :users, :username, :string, after: :id
    add_index   :users, :username, unique: true
  end
end
