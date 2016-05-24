class ChangeDevise < ActiveRecord::Migration
  def change
    remove_column :users, :email, :string, null: true
  end
end
