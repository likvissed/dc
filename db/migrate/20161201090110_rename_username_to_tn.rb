class RenameUsernameToTn < ActiveRecord::Migration
  def change
    add_column :users, :tn, :integer, after: :id, index: true
    rename_column :users, :username, :info
  end
end
